-- RumahList v1 schema: households, members, shopping items, sessions, activity.
-- Item prices are per quantity unit (e.g. per gram), so total = price × quantity.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members(user_id);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  category text not null default 'other',
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'pcs' check (char_length(unit) between 1 and 20),
  estimated_price numeric(14,3) check (estimated_price >= 0),
  actual_price numeric(14,3) check (actual_price >= 0),
  priority text not null default 'normal' check (priority in ('urgent','normal','optional')),
  status text not null default 'pending' check (status in ('pending','purchased','unavailable','cancelled')),
  notes text check (char_length(notes) <= 300),
  added_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  checked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shopping_items_household_idx on public.shopping_items(household_id, status);

create table public.shopping_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  shopper_id uuid references auth.users(id) on delete set null,
  store_name text,
  payment_method text,
  notes text,
  item_count integer not null default 0,
  total_estimated integer not null default 0,
  total_actual integer not null default 0,
  shopped_at timestamptz not null default now()
);
create index shopping_sessions_household_idx on public.shopping_sessions(household_id, shopped_at desc);

create table public.shopping_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.shopping_sessions(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  category text not null,
  quantity numeric(12,3) not null,
  unit text not null,
  estimated_price numeric(14,3),
  actual_price numeric(14,3)
);
create index shopping_session_items_session_idx on public.shopping_session_items(session_id);
create index shopping_session_items_name_idx on public.shopping_session_items(household_id, lower(name));

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  item_name text,
  created_at timestamptz not null default now()
);
create index activity_logs_household_idx on public.activity_logs(household_id, created_at desc);

-- ---------------------------------------------------------------- helpers

create or replace function public.member_role(p_household uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from household_members where household_id = p_household and user_id = auth.uid();
$$;

create or replace function public.is_member(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = p_household and user_id = auth.uid());
$$;

create or replace function public.can_edit(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.member_role(p_household) in ('owner','admin','member'), false);
$$;

create or replace function public.is_owner(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.member_role(p_household) = 'owner', false);
$$;

create or replace function public.shares_household(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members a join household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

create or replace function public.gen_invite_code()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.households where invite_code = code);
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------- triggers

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger shopping_items_touch before update on public.shopping_items
  for each row execute function public.touch_updated_at();

create or replace function public.log_item_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('rumahlist.skip_item_log', true) = 'on' then
    return coalesce(new, old);
  end if;
  if tg_op = 'INSERT' then
    insert into activity_logs (household_id, actor_id, action, item_name)
    values (new.household_id, auth.uid(), 'added', new.name);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into activity_logs (household_id, actor_id, action, item_name)
    values (new.household_id, auth.uid(),
      case new.status when 'purchased' then 'purchased' when 'unavailable' then 'unavailable'
                      when 'cancelled' then 'cancelled' else 'unchecked' end,
      new.name);
  elsif tg_op = 'UPDATE' and new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    insert into activity_logs (household_id, actor_id, action, item_name)
    values (new.household_id, auth.uid(), 'assigned', new.name);
  elsif tg_op = 'DELETE' and auth.uid() is not null then
    insert into activity_logs (household_id, actor_id, action, item_name)
    values (old.household_id, auth.uid(), 'deleted', old.name);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger shopping_items_activity after insert or update or delete on public.shopping_items
  for each row execute function public.log_item_activity();

-- ---------------------------------------------------------------- RPCs

create or replace function public.create_household(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Harus masuk terlebih dahulu'; end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Nama keluarga wajib diisi'; end if;
  insert into households (name, invite_code, created_by)
  values (trim(p_name), gen_invite_code(), auth.uid()) returning id into hid;
  insert into household_members (household_id, user_id, role) values (hid, auth.uid(), 'owner');
  insert into activity_logs (household_id, actor_id, action) values (hid, auth.uid(), 'created_household');
  return hid;
end;
$$;

create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Harus masuk terlebih dahulu'; end if;
  select id into hid from households where invite_code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if hid is null then raise exception 'Kode tidak ditemukan'; end if;
  if exists (select 1 from household_members where household_id = hid and user_id = auth.uid()) then
    return hid;
  end if;
  insert into household_members (household_id, user_id, role) values (hid, auth.uid(), 'member');
  insert into activity_logs (household_id, actor_id, action) values (hid, auth.uid(), 'joined');
  return hid;
end;
$$;

create or replace function public.regenerate_invite_code(p_household uuid)
returns text language plpgsql security definer set search_path = public as $$
declare code text;
begin
  if not public.is_owner(p_household) then raise exception 'Hanya pemilik yang bisa mengganti kode'; end if;
  code := gen_invite_code();
  update households set invite_code = code where id = p_household;
  return code;
end;
$$;

-- Moves the caller's checked items into a new session. Items marked purchased by
-- this shopper go to history; items they marked unavailable go back to pending.
create or replace function public.finish_shopping_session(
  p_household uuid, p_store text, p_payment text, p_notes text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  sid uuid;
  n integer;
  est integer;
  act integer;
begin
  if not public.can_edit(p_household) then raise exception 'Tidak punya izin'; end if;

  select count(*),
         coalesce(round(sum(coalesce(estimated_price, 0) * quantity)), 0),
         coalesce(round(sum(coalesce(actual_price, estimated_price, 0) * quantity)), 0)
    into n, est, act
  from shopping_items
  where household_id = p_household and status = 'purchased' and checked_by = auth.uid();

  if n = 0 then raise exception 'Belum ada barang yang dicentang'; end if;

  insert into shopping_sessions (household_id, shopper_id, store_name, payment_method, notes,
                                 item_count, total_estimated, total_actual)
  values (p_household, auth.uid(), nullif(trim(p_store), ''), nullif(trim(p_payment), ''),
          nullif(trim(p_notes), ''), n, est, act)
  returning id into sid;

  insert into shopping_session_items (session_id, household_id, name, category, quantity, unit,
                                      estimated_price, actual_price)
  select sid, household_id, name, category, quantity, unit, estimated_price, actual_price
  from shopping_items
  where household_id = p_household and status = 'purchased' and checked_by = auth.uid();

  -- Skip the per-item "deleted" activity rows: one "finished_session" row says it all.
  perform set_config('rumahlist.skip_item_log', 'on', true);
  delete from shopping_items
  where household_id = p_household and checked_by = auth.uid() and status in ('purchased','cancelled');
  update shopping_items set status = 'pending', checked_by = null, actual_price = null
  where household_id = p_household and checked_by = auth.uid() and status = 'unavailable';
  perform set_config('rumahlist.skip_item_log', 'off', true);

  insert into activity_logs (household_id, actor_id, action, item_name)
  values (p_household, auth.uid(), 'finished_session', coalesce(nullif(trim(p_store), ''), null));
  return sid;
end;
$$;

-- ---------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.shopping_items enable row level security;
alter table public.shopping_sessions enable row level security;
alter table public.shopping_session_items enable row level security;
alter table public.activity_logs enable row level security;

create policy "read own or co-member profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_household(id));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members read household" on public.households for select to authenticated
  using (public.is_member(id));
create policy "owner updates household" on public.households for update to authenticated
  using (public.is_owner(id)) with check (public.is_owner(id));

create policy "members read members" on public.household_members for select to authenticated
  using (public.is_member(household_id));
create policy "owner changes non-owner roles" on public.household_members for update to authenticated
  using (public.is_owner(household_id) and role <> 'owner')
  with check (public.is_owner(household_id) and role in ('admin','member','viewer'));
create policy "owner removes members or member leaves" on public.household_members for delete to authenticated
  using (role <> 'owner' and (public.is_owner(household_id) or user_id = auth.uid()));

create policy "members read items" on public.shopping_items for select to authenticated
  using (public.is_member(household_id));
create policy "editors add items" on public.shopping_items for insert to authenticated
  with check (public.can_edit(household_id) and added_by = auth.uid());
create policy "editors update items" on public.shopping_items for update to authenticated
  using (public.can_edit(household_id)) with check (public.can_edit(household_id));
create policy "editors delete items" on public.shopping_items for delete to authenticated
  using (public.can_edit(household_id));

create policy "members read sessions" on public.shopping_sessions for select to authenticated
  using (public.is_member(household_id));
create policy "members read session items" on public.shopping_session_items for select to authenticated
  using (public.is_member(household_id));
create policy "members read activity" on public.activity_logs for select to authenticated
  using (public.is_member(household_id));

revoke execute on function public.gen_invite_code() from public, anon, authenticated;

-- ---------------------------------------------------------------- realtime

alter table public.shopping_items replica identity full;
alter publication supabase_realtime add table public.shopping_items, public.activity_logs, public.household_members;

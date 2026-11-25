# RumahList v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA daftar belanja keluarga yang sinkron real-time antar HP, dengan Mode Belanja dan Riwayat.

**Architecture:** Next.js App Router (client components untuk halaman data agar bisa berlangganan Supabase Realtime). Semua aturan akses di Postgres (RLS + fungsi `security definer` untuk operasi multi-langkah). Pengembangan & tes memakai Supabase lokal (Docker); produksi memakai proyek Supabase milik pengguna.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4, @supabase/supabase-js 2, @supabase/ssr, lucide-react, Vitest, Supabase CLI.

**Spec:** `docs/superpowers/specs/2026-11-25-rumahlist-v1-design.md`

## Global Constraints
- Bahasa UI: Indonesia.
- Mata uang: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })` → `Rp150.000` (tanpa spasi).
- Peran: `owner | admin | member | viewer`. Viewer tidak bisa menulis apa pun.
- Status barang: `pending | purchased | unavailable | cancelled`. Prioritas: `urgent | normal | optional`.
- Harga disimpan per satuan (integer rupiah); total = harga × jumlah.
- Warna: latar `#F7F5F0`, sage `#7C9A7E` (gelap `#5E7D61`), abu `#E7E4DD`, teks `#2B2B2B`.
- Target sentuh ≥ 44px; teks dasar 16px.

## Review Focus
1. Pengguna dari keluarga A membaca/menulis barang keluarga B → harus ditolak RLS (tes `rls.test.ts`: "user B cannot read household A items").
2. Viewer mencoba menambah barang → ditolak (tes: "viewer cannot insert item").
3. Dua orang mencentang barang yang sama → hanya satu tercatat (tes: "second purchase of same item affects 0 rows").
4. Kode undangan salah / huruf kecil / spasi → kode dinormalisasi `upper(trim())`, kode salah memberi pesan "Kode tidak ditemukan" (tes: "join with lowercase code works", "join with bad code fails").
5. Harga asli kosong saat selesai belanja → total memakai harga perkiraan (tes `totals.test.ts`: "falls back to estimated price").

---

### Task 1: Scaffold + util murni
**Files:** Create proyek Next.js di root; `lib/format.ts`, `lib/totals.ts`, `lib/constants.ts`, `lib/types.ts`; Test `tests/format.test.ts`, `tests/totals.test.ts`.

**Interfaces — Produces:**
- `formatRupiah(n: number): string`
- `parseRupiah(s: string): number | null` — menerima "28rb", "28.000", "Rp28.000", "1,5jt".
- `estimatedTotal(items: Pick<ShoppingItem,'quantity'|'estimated_price'|'status'>[]): number` — hanya status pending/purchased.
- `actualTotal(items: Pick<ShoppingItem,'quantity'|'estimated_price'|'actual_price'|'status'>[]): number` — hanya purchased; fallback ke estimated.
- `CATEGORIES`, `UNITS`, `PRIORITIES`, `STATUSES`, `ROLES` dengan label Indonesia.
- Types: `Role`, `ItemStatus`, `Priority`, `ShoppingItem`, `Household`, `Member`, `ShoppingSession`, `SessionItem`, `Activity`.

- [ ] Tes: `formatRupiah(150000) === 'Rp150.000'`; `parseRupiah('28rb') === 28000`; `parseRupiah('1,5jt') === 1500000`; `parseRupiah('abc') === null`; `estimatedTotal` mengabaikan cancelled/unavailable; `actualTotal` fallback estimated bila actual null.
- [ ] Jalankan `npx vitest run` → FAIL, implementasi, → PASS.

### Task 2: Skema database + RLS
**Files:** `supabase/migrations/20261125000000_init.sql`; Test `tests/rls.test.ts` (memakai Supabase lokal).

**Produces (SQL):**
- Tabel: `profiles(id, display_name)`, `households(id, name, invite_code unique, created_by)`, `household_members(household_id, user_id, role, joined_at)`, `shopping_items(...)`, `shopping_sessions(id, household_id, shopper_id, store_name, payment_method, notes, total_estimated, total_actual, item_count, shopped_at)`, `shopping_session_items(...)`, `activity_logs(id, household_id, actor_id, action, item_name, created_at)`.
- Fungsi RPC: `create_household(p_name text) returns uuid`, `join_household(p_code text) returns uuid`, `regenerate_invite_code(p_household uuid) returns text`, `finish_shopping_session(p_household uuid, p_store text, p_payment text, p_notes text) returns uuid`.
- Helper: `is_member(uuid)`, `can_edit(uuid)`, `is_owner(uuid)`.
- Trigger: profil otomatis dari `auth.users`; log aktivitas otomatis pada insert/ubah status/hapus barang.
- Publikasi realtime: `shopping_items`, `activity_logs`, `household_members`.

- [ ] Tes (Review Focus 1–4) + "finish session moves purchased items and returns unavailable to pending".
- [ ] `npx supabase db reset` lalu `npx vitest run tests/rls.test.ts` → PASS.

### Task 3: Auth + onboarding keluarga
**Files:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`, `app/masuk/page.tsx`, `app/daftar-akun/page.tsx`, `app/mulai/page.tsx`, `components/household-provider.tsx`.
**Produces:** `useHousehold(): { household, me: Member, members, role, canEdit, refresh }`.
- [ ] Verifikasi di browser: daftar → buat keluarga → muncul dashboard; akun kedua gabung pakai kode.

### Task 4: Daftar Belanja + realtime
**Files:** `hooks/use-shopping-items.ts`, `components/item-form.tsx`, `components/item-row.tsx`, `app/(app)/daftar/page.tsx`.
**Produces:** `useShoppingItems(householdId): { items, loading, refetch }` — refetch saat event realtime.
- [ ] Verifikasi: dua jendela browser, tambah barang di satu → muncul di lainnya.

### Task 5: Mode Belanja + Riwayat
**Files:** `app/(app)/belanja/page.tsx`, `app/(app)/riwayat/page.tsx`, `app/(app)/riwayat/[id]/page.tsx`.
- [ ] Centang memakai `update ... eq('status','pending')`; bila 0 baris → toast "Sudah dicentang anggota lain".
- [ ] Verifikasi: centang 2 barang, isi harga, selesai → sesi muncul di Riwayat dengan total benar.

### Task 6: Dashboard, Keluarga, navigasi, PWA
**Files:** `app/(app)/layout.tsx`, `components/nav.tsx`, `app/(app)/page.tsx`, `app/(app)/keluarga/page.tsx`, `app/manifest.ts`, `public/icon-*.png`.
- [ ] Verifikasi: tampilan HP (375px) navigasi bawah, desktop sidebar; `npm run build` sukses.

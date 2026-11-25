/**
 * Integration tests against the local Supabase stack (`npx supabase start`).
 * Skipped automatically when the stack isn't reachable.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const KEY = process.env.SUPABASE_TEST_ANON_KEY ?? "";

const reachable = KEY
  ? await fetch(`${URL}/auth/v1/health`, { headers: { apikey: KEY } }).then((r) => r.ok).catch(() => false)
  : false;

async function newUser(name: string): Promise<{ db: SupabaseClient; id: string }> {
  const db = createClient(URL, KEY, { auth: { persistSession: false } });
  const email = `${name}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await db.auth.signUp({
    email,
    password: "test-password-123",
    options: { data: { display_name: name } },
  });
  if (error) throw error;
  return { db, id: data.user!.id };
}

describe.skipIf(!reachable)("household isolation & rules", () => {
  let a: Awaited<ReturnType<typeof newUser>>;
  let b: Awaited<ReturnType<typeof newUser>>;
  let viewer: Awaited<ReturnType<typeof newUser>>;
  let hhA: string;
  let code: string;
  let itemId: string;

  beforeAll(async () => {
    a = await newUser("ibu");
    b = await newUser("tetangga");
    viewer = await newUser("nenek");
    const { data, error } = await a.db.rpc("create_household", { p_name: "Keluarga A" });
    if (error) throw error;
    hhA = data;
    const { data: hh } = await a.db.from("households").select("invite_code").eq("id", hhA).single();
    code = hh!.invite_code;
    const { data: item } = await a.db
      .from("shopping_items")
      .insert({ household_id: hhA, name: "Beras", quantity: 5, unit: "kg", estimated_price: 14000, added_by: a.id })
      .select()
      .single();
    itemId = item!.id;
  });

  it("creates a profile with the display name", async () => {
    const { data } = await a.db.from("profiles").select("display_name").eq("id", a.id).single();
    expect(data!.display_name).toBe("ibu");
  });

  it("user B cannot read household A items", async () => {
    const { data } = await b.db.from("shopping_items").select("*").eq("household_id", hhA);
    expect(data).toEqual([]);
  });

  it("user B cannot insert into household A", async () => {
    const { error } = await b.db
      .from("shopping_items")
      .insert({ household_id: hhA, name: "Hack", added_by: b.id });
    expect(error).not.toBeNull();
  });

  it("join with bad code fails", async () => {
    const { error } = await b.db.rpc("join_household", { p_code: "ZZZZZZ" });
    expect(error?.message).toContain("Kode tidak ditemukan");
  });

  it("join with lowercase code works and grants access", async () => {
    const { error } = await viewer.db.rpc("join_household", { p_code: ` ${code.toLowerCase()} ` });
    expect(error).toBeNull();
    const { data } = await viewer.db.from("shopping_items").select("id").eq("household_id", hhA);
    expect(data).toHaveLength(1);
  });

  it("only the owner can change roles", async () => {
    const { data: denied } = await viewer.db
      .from("household_members")
      .update({ role: "admin" })
      .eq("household_id", hhA)
      .eq("user_id", viewer.id)
      .select();
    expect(denied).toEqual([]);
    const { data: ok } = await a.db
      .from("household_members")
      .update({ role: "viewer" })
      .eq("household_id", hhA)
      .eq("user_id", viewer.id)
      .select();
    expect(ok).toHaveLength(1);
  });

  it("viewer cannot insert item", async () => {
    const { error } = await viewer.db
      .from("shopping_items")
      .insert({ household_id: hhA, name: "Gula", added_by: viewer.id });
    expect(error).not.toBeNull();
  });

  it("second purchase of same item affects 0 rows", async () => {
    const first = await a.db
      .from("shopping_items")
      .update({ status: "purchased", checked_by: a.id, actual_price: 15000 })
      .eq("id", itemId)
      .eq("status", "pending")
      .select();
    expect(first.data).toHaveLength(1);
    const second = await a.db
      .from("shopping_items")
      .update({ status: "purchased", checked_by: a.id })
      .eq("id", itemId)
      .eq("status", "pending")
      .select();
    expect(second.data).toHaveLength(0);
  });

  it("finish session moves purchased items and returns unavailable to pending", async () => {
    const { data: telur } = await a.db
      .from("shopping_items")
      .insert({ household_id: hhA, name: "Telur", quantity: 1, unit: "kg", estimated_price: 28000, added_by: a.id })
      .select()
      .single();
    await a.db.from("shopping_items").update({ status: "unavailable", checked_by: a.id }).eq("id", telur!.id);

    const { data: sid, error } = await a.db.rpc("finish_shopping_session", {
      p_household: hhA, p_store: "Pasar Minggu", p_payment: "Tunai", p_notes: "",
    });
    expect(error).toBeNull();

    const { data: session } = await a.db.from("shopping_sessions").select("*").eq("id", sid).single();
    expect(session!.item_count).toBe(1);
    expect(session!.total_actual).toBe(75000);
    expect(session!.total_estimated).toBe(70000);

    const { data: remaining } = await a.db.from("shopping_items").select("name,status,checked_by").eq("household_id", hhA);
    expect(remaining).toEqual([{ name: "Telur", status: "pending", checked_by: null }]);
  });

  it("finish session totals fractional per-gram prices exactly", async () => {
    // 250 gram at Rp40/gram (Rp40.000/kg) estimated, Rp44/gram actual.
    await a.db.from("shopping_items").insert({
      household_id: hhA, name: "Bawang putih", quantity: 250, unit: "gram",
      estimated_price: 40, actual_price: 44, status: "purchased", checked_by: a.id, added_by: a.id,
    });
    const { data: sid, error } = await a.db.rpc("finish_shopping_session", {
      p_household: hhA, p_store: "", p_payment: "", p_notes: "",
    });
    expect(error).toBeNull();
    const { data: s } = await a.db.from("shopping_sessions").select("*").eq("id", sid).single();
    expect(s!.total_estimated).toBe(10000);
    expect(s!.total_actual).toBe(11000);
  });

  it("finish session with nothing checked fails", async () => {
    const { error } = await a.db.rpc("finish_shopping_session", {
      p_household: hhA, p_store: "", p_payment: "", p_notes: "",
    });
    expect(error?.message).toContain("Belum ada barang");
  });

  it("user B cannot read household A sessions or activity", async () => {
    const s = await b.db.from("shopping_sessions").select("id").eq("household_id", hhA);
    const l = await b.db.from("activity_logs").select("id").eq("household_id", hhA);
    expect(s.data).toEqual([]);
    expect(l.data).toEqual([]);
  });
});

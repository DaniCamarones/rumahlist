import { describe, expect, it } from "vitest";
import {
  addItem,
  buyAgain,
  frequentItems,
  deleteItem,
  duplicateItem,
  emptyState,
  exportState,
  finishSession,
  importState,
  setActualPrice,
  setStatus,
  updateItem,
  type Ctx,
} from "@/lib/local/state";

function ctx(): Ctx {
  let n = 0;
  let t = Date.parse("2026-11-25T08:00:00Z");
  return { id: () => `id${++n}`, now: () => new Date((t += 1000)).toISOString() };
}

describe("items", () => {
  it("adds an item with defaults and trims the name", () => {
    const c = ctx();
    const { state, item } = addItem(emptyState(), { name: "  Beras " }, c);
    expect(item).toMatchObject({ name: "Beras", category: "other", unit: "pcs", quantity: 1, status: "pending", priority: "normal" });
    expect(state.items).toHaveLength(1);
  });

  it("rejects an empty name or non-positive quantity", () => {
    expect(() => addItem(emptyState(), { name: "  " }, ctx())).toThrow("Nama barang wajib diisi");
    expect(() => addItem(emptyState(), { name: "Gula", quantity: 0 }, ctx())).toThrow("Jumlah harus lebih dari 0");
  });

  it("updates, duplicates and deletes", () => {
    const c = ctx();
    const added = addItem(emptyState(), { name: "Telur", unit: "kg" }, c);
    const item = added.item;
    let state = updateItem(added.state, item.id, { quantity: 2, notes: "yang besar" }, c);
    expect(state.items[0]).toMatchObject({ quantity: 2, notes: "yang besar" });
    state = duplicateItem(state, item.id, c);
    expect(state.items.map((i) => i.name)).toEqual(["Telur", "Telur"]);
    state = deleteItem(state, item.id);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).not.toBe(item.id);
  });

  it("changes status and stores actual price", () => {
    const c = ctx();
    const added = addItem(emptyState(), { name: "Bayam" }, c);
    const item = added.item;
    let state = setStatus(added.state, item.id, "purchased", c);
    state = setActualPrice(state, item.id, 4500, c);
    expect(state.items[0]).toMatchObject({ status: "purchased", actual_price: 4500 });
  });
});

describe("finishSession", () => {
  it("moves purchased items to a receipt, returns unavailable to the list, drops cancelled", () => {
    const c = ctx();
    let s = emptyState();
    const add = (o: Parameters<typeof addItem>[1]) => {
      const r = addItem(s, o, c);
      s = r.state;
      return r.item;
    };
    const beras = add({ name: "Beras", quantity: 5, unit: "kg", estimated_price: 14000 });
    const bawang = add({ name: "Bawang putih", quantity: 250, unit: "gram", estimated_price: 40 });
    const telur = add({ name: "Telur", quantity: 1, unit: "kg", estimated_price: 28000 });
    const sabun = add({ name: "Sabun", estimated_price: 15000 });
    add({ name: "Gula" });

    s = setStatus(s, beras.id, "purchased", c);
    s = setActualPrice(s, beras.id, 15000, c);
    s = setStatus(s, bawang.id, "purchased", c);
    s = setActualPrice(s, bawang.id, 44, c);
    s = setStatus(s, telur.id, "unavailable", c);
    s = setStatus(s, sabun.id, "cancelled", c);

    const { state, sessionId } = finishSession(s, { store: " Pasar Minggu ", payment: "Tunai", notes: "" }, c);
    const session = state.sessions.find((x) => x.id === sessionId)!;
    expect(session).toMatchObject({ store_name: "Pasar Minggu", payment_method: "Tunai", notes: null, item_count: 2 });
    expect(session.total_estimated).toBe(80000);
    expect(session.total_actual).toBe(86000);
    expect(state.sessionItems.filter((i) => i.session_id === sessionId).map((i) => i.name)).toEqual(["Beras", "Bawang putih"]);
    expect(state.items.map((i) => [i.name, i.status])).toEqual([
      ["Telur", "pending"],
      ["Gula", "pending"],
    ]);
  });

  it("refuses to finish with nothing checked", () => {
    const c = ctx();
    const { state } = addItem(emptyState(), { name: "Gula" }, c);
    expect(() => finishSession(state, { store: "", payment: "", notes: "" }, c)).toThrow("Belum ada barang yang dicentang");
  });
});

describe("backup", () => {
  it("round-trips through export and import", () => {
    const c = ctx();
    const { state } = addItem(emptyState(), { name: "Kopi" }, c);
    const restored = importState(exportState(state));
    expect(restored.items[0].name).toBe("Kopi");
  });

  it("rejects files that are not a RumahList backup", () => {
    expect(() => importState("{}")).toThrow("File cadangan tidak dikenali");
    expect(() => importState("bukan json")).toThrow("File cadangan tidak dikenali");
    expect(() => importState(JSON.stringify({ app: "rumahlist", version: 1, data: { items: "x" } }))).toThrow(
      "File cadangan tidak dikenali",
    );
  });
});

describe("buy again", () => {
  function withReceipt() {
    const c = ctx();
    let s = emptyState();
    for (const o of [
      { name: "Beras", quantity: 5, unit: "kg", category: "staple", estimated_price: 14000 },
      { name: "Bawang putih", quantity: 250, unit: "gram", category: "spice", estimated_price: 40 },
    ]) {
      const r = addItem(s, o, c);
      s = setStatus(r.state, r.item.id, "purchased", c);
    }
    s = setActualPrice(s, s.items[0].id, 15000, c);
    const r = finishSession(s, { store: "", payment: "", notes: "" }, c);
    return { c, state: r.state, sessionId: r.sessionId };
  }

  it("puts a receipt's items back on the list, using the last paid price as the new estimate", () => {
    const { c, state, sessionId } = withReceipt();
    const { state: next, added } = buyAgain(state, sessionId, undefined, c);
    expect(added).toBe(2);
    expect(next.items.map((i) => [i.name, i.quantity, i.unit, i.category, i.estimated_price, i.status])).toEqual([
      ["Beras", 5, "kg", "staple", 15000, "pending"],
      ["Bawang putih", 250, "gram", "spice", 40, "pending"],
    ]);
  });

  it("skips items already waiting on the list and can take a single line", () => {
    const { c, state, sessionId } = withReceipt();
    const lineId = state.sessionItems.find((l) => l.name === "Beras")!.id;
    const once = buyAgain(state, sessionId, [lineId], c);
    expect(once.added).toBe(1);
    const twice = buyAgain(once.state, sessionId, undefined, c);
    expect(twice.added).toBe(1);
    expect(twice.state.items.map((i) => i.name)).toEqual(["Beras", "Bawang putih"]);
  });

  it("lists frequently bought items not already on the list, most frequent first", () => {
    const receipt = withReceipt();
    const c = receipt.c;
    let state = receipt.state;
    const r = addItem(state, { name: "Bawang putih", unit: "gram", quantity: 100 }, c);
    state = finishSession(setStatus(r.state, r.item.id, "purchased", c), { store: "", payment: "", notes: "" }, c).state;
    expect(frequentItems(state).map((f) => f.name)).toEqual(["Bawang putih", "Beras"]);
    state = addItem(state, { name: "beras" }, c).state;
    expect(frequentItems(state).map((f) => f.name)).toEqual(["Bawang putih"]);
  });
});

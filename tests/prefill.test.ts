import { describe, expect, it } from "vitest";
import { addItem, emptyState, finishSession, setActualPrice, setStatus } from "@/lib/local/state";
import { prefillFor } from "@/lib/prefill";

describe("prefillFor", () => {
  it("guesses unit and category from the catalog but leaves the quantity empty for a first purchase", () => {
    const p = prefillFor(emptyState(), "bawang putih");
    expect(p).toEqual({
      name: "Bawang putih", category: "spice", unit: "gram", quantity: null, estimated_price: null, last: null,
    });
  });

  it("leaves unit and category unpicked for an unknown item", () => {
    const p = prefillFor(emptyState(), "Kerupuk Finna");
    expect(p).toMatchObject({ name: "Kerupuk Finna", category: "", unit: "", quantity: null });
  });

  it("copies everything from the last purchase, including a changed category", () => {
    let s = emptyState();
    const r = addItem(s, { name: "Bawang putih", quantity: 300, unit: "gram", category: "vegetable" });
    s = setActualPrice(setStatus(r.state, r.item.id, "purchased"), r.item.id, 42);
    s = finishSession(s, { store: "", payment: "", notes: "" }).state;
    const p = prefillFor(s, "BAWANG PUTIH");
    expect(p).toMatchObject({ name: "Bawang putih", category: "vegetable", unit: "gram", quantity: 300, estimated_price: 42 });
    expect(p.last?.shopped_at).toBe(s.sessions[0].shopped_at);
  });
});

import { describe, expect, it } from "vitest";
import { actualTotal, estimatedTotal } from "@/lib/totals";

const item = (
  status: "pending" | "purchased" | "unavailable" | "cancelled",
  quantity: number | null,
  estimated_price: number | null,
  actual_price: number | null = null,
) => ({ status, quantity, estimated_price, actual_price });

describe("estimatedTotal", () => {
  it("sums price x quantity for pending and purchased only", () => {
    const items = [
      item("pending", 2, 10000),
      item("purchased", 0.5, 120000),
      item("cancelled", 3, 5000),
      item("unavailable", 1, 9000),
      item("pending", 1, null),
      item("pending", null, 30000),
    ];
    expect(estimatedTotal(items)).toBe(80000);
  });
});

describe("actualTotal", () => {
  it("sums actual price x quantity for purchased items", () => {
    expect(actualTotal([item("purchased", 2, 10000, 12000)])).toBe(24000);
  });
  it("falls back to estimated price when actual is empty", () => {
    expect(actualTotal([item("purchased", 2, 10000, null)])).toBe(20000);
  });
  it("ignores items that were not purchased", () => {
    expect(actualTotal([item("pending", 2, 10000, 12000)])).toBe(0);
  });
  it("rounds to whole rupiah", () => {
    expect(actualTotal([item("purchased", 0.333, 10000, null)])).toBe(3330);
  });
});

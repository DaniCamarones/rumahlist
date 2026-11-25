import { describe, expect, it } from "vitest";
import { priceUnit, toDisplayPrice, toStoredPrice } from "@/lib/units";

describe("price units", () => {
  it("prices gram items per kg and ml items per liter", () => {
    expect(priceUnit("gram")).toEqual({ label: "kg", factor: 1000 });
    expect(priceUnit("ml")).toEqual({ label: "liter", factor: 1000 });
    expect(priceUnit("pcs")).toEqual({ label: "pcs", factor: 1 });
    expect(priceUnit("renteng")).toEqual({ label: "renteng", factor: 1 });
  });
  it("converts between display (per kg) and stored (per gram) prices", () => {
    expect(toStoredPrice(40000, "gram")).toBe(40);
    expect(toStoredPrice(33333, "gram")).toBe(33.333);
    expect(toDisplayPrice(40, "gram")).toBe(40000);
    expect(toDisplayPrice(33.333, "gram")).toBe(33333);
    expect(toStoredPrice(15000, "kg")).toBe(15000);
    expect(toDisplayPrice(null, "gram")).toBeNull();
  });
});

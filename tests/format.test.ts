import { describe, expect, it } from "vitest";
import { formatRupiah, parseRupiah } from "@/lib/format";

describe("formatRupiah", () => {
  it("formats with Indonesian separators and no space", () => {
    expect(formatRupiah(150000)).toBe("Rp150.000");
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(1250500)).toBe("Rp1.250.500");
  });
});

describe("parseRupiah", () => {
  it("parses plain and dotted numbers", () => {
    expect(parseRupiah("28000")).toBe(28000);
    expect(parseRupiah("28.000")).toBe(28000);
    expect(parseRupiah("Rp28.000")).toBe(28000);
  });
  it("parses rb / k / jt shorthand", () => {
    expect(parseRupiah("28rb")).toBe(28000);
    expect(parseRupiah("15k")).toBe(15000);
    expect(parseRupiah("1,5jt")).toBe(1500000);
    expect(parseRupiah("2.5 rb")).toBe(2500);
  });
  it("returns null for empty or invalid input", () => {
    expect(parseRupiah("")).toBeNull();
    expect(parseRupiah("abc")).toBeNull();
    expect(parseRupiah("-5000")).toBeNull();
  });
});

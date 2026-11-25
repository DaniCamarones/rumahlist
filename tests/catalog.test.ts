import { describe, expect, it } from "vitest";
import { CATALOG, findCatalogItem, searchCatalog } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";

describe("catalog data", () => {
  it("has a few hundred items", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(250);
  });
  it("uses only known categories and has no duplicate names", () => {
    const ids = new Set<string>(CATEGORIES.map((c) => c.id));
    const names = new Set<string>();
    for (const item of CATALOG) {
      expect(ids.has(item.category), item.name).toBe(true);
      expect(names.has(item.name.toLowerCase()), item.name).toBe(false);
      names.add(item.name.toLowerCase());
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unit.length).toBeGreaterThan(0);
    }
  });
  it("covers every category", () => {
    for (const c of CATEGORIES.filter((c) => c.id !== "other")) {
      expect(CATALOG.some((i) => i.category === c.id), c.id).toBe(true);
    }
  });
});

describe("searchCatalog", () => {
  it("returns nothing for an empty query", () => {
    expect(searchCatalog("   ")).toEqual([]);
  });
  it("lists items starting with a single letter first", () => {
    const r = searchCatalog("a", 10);
    expect(r.length).toBe(10);
    expect(r.every((i) => i.name.toLowerCase().startsWith("a"))).toBe(true);
  });
  it("matches any word in the name, ignoring case", () => {
    const names = searchCatalog("PUTIH", 20).map((i) => i.name);
    expect(names).toContain("Bawang putih");
  });
  it("ranks whole-name prefix before word prefix before substring", () => {
    const names = searchCatalog("bawang", 10).map((i) => i.name);
    expect(names.slice(0, 4)).toEqual(["Bawang bombay", "Bawang goreng", "Bawang merah", "Bawang putih"]);
    // "Daun bawang" only has a later word starting with the query, so it comes after.
    expect(names.indexOf("Daun bawang")).toBeGreaterThan(3);
  });
  it("returns nothing when no item matches", () => {
    expect(searchCatalog("zzqx")).toEqual([]);
  });
});

describe("findCatalogItem", () => {
  it("finds an exact name regardless of case and spaces", () => {
    expect(findCatalogItem("  bawang PUTIH ")?.category).toBe("spice");
    expect(findCatalogItem("barang aneh")).toBeUndefined();
  });
});

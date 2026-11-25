import { describe, expect, it } from "vitest";
import { iconFor } from "@/lib/item-icon";

describe("iconFor", () => {
  it("matches common Indonesian grocery names", () => {
    expect(iconFor("Bawang putih", "spice")).toBe("🧄");
    expect(iconFor("bawang merah", "spice")).toBe("🧅");
    expect(iconFor("Cabai rawit", "vegetable")).toBe("🌶️");
    expect(iconFor("Beras 5kg", "staple")).toBe("🍚");
    expect(iconFor("Minyak goreng", "cooking")).toBe("🫗");
    expect(iconFor("Pisang ambon", "fruit")).toBe("🍌");
  });
  it("prefers the more specific keyword", () => {
    expect(iconFor("Telur ayam", "cooking")).toBe("🥚");
    expect(iconFor("Ayam potong", "meat")).toBe("🍗");
    expect(iconFor("Susu kotak", "drink")).toBe("🥛");
  });
  it("matches whole words only", () => {
    // "teh" must not match inside "kentang"... "tahu" must not match "tahun"
    expect(iconFor("Kentang", "vegetable")).toBe("🥔");
    expect(iconFor("Kue tahunan", "snack")).not.toBe("🧈");
  });
  it("falls back to the category icon", () => {
    expect(iconFor("Barang aneh", "cleaning")).toBe("🧽");
    expect(iconFor("Barang aneh", "tidak-ada")).toBe("📦");
  });
});

describe("iconImage", () => {
  it("points to the 3D picture for a known item", async () => {
    const { iconImage } = await import("@/lib/item-icon");
    expect(iconImage("Bawang putih", "spice")).toBe("/icons/garlic.png");
    expect(iconImage("Barang aneh", "cleaning")).toBe("/icons/sponge.png");
  });
  it("has a picture file for every icon the app can show", async () => {
    const fs = await import("node:fs");
    const { ICON_FILES } = await import("@/lib/icon-assets");
    for (const file of Object.values(ICON_FILES)) {
      expect(fs.existsSync(`public/icons/${file}.png`), file).toBe(true);
    }
  });
});

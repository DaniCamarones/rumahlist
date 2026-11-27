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

describe("itemPhoto", () => {
  it("matches catalog items and Indonesian colloquial names", async () => {
    const { itemPhoto } = await import("@/lib/item-photos");
    expect(itemPhoto("Cabai rawit")).toBe("/photos/cabai-rawit.webp");
    expect(itemPhoto("Cabe rawit merah")).toBe("/photos/cabai-rawit.webp");
    expect(itemPhoto("Cabe ijo")).toBe("/photos/cabai-hijau.webp");
    expect(itemPhoto("Cabe")).toBe("/photos/cabai-merah-besar.webp");
    expect(itemPhoto("Terong ungu")).toBe("/photos/terong.webp");
    expect(itemPhoto("Terung")).toBe("/photos/terong.webp");
    expect(itemPhoto("Pasta gigi Pepsodent")).toBe("/photos/pasta-gigi.webp");
    expect(itemPhoto("Indomie goreng")).toBe("/photos/mie-instan.webp");
    expect(itemPhoto("Barang aneh")).toBeNull();
  });

  it("has a real photo file on disk for every catalog item and alias", async () => {
    const fs = await import("node:fs");
    const { CATALOG } = await import("@/lib/catalog");
    const { ALL_PHOTO_SLUGS, itemPhoto } = await import("@/lib/item-photos");
    for (const item of CATALOG) {
      const path = itemPhoto(item.name);
      expect(path, item.name).not.toBeNull();
      expect(fs.existsSync(`public${path}`), `${item.name} -> ${path}`).toBe(true);
    }
    for (const slug of ALL_PHOTO_SLUGS) {
      expect(fs.existsSync(`public/photos/${slug}.webp`), slug).toBe(true);
    }
  });
});

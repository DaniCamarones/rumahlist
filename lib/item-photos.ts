import { CATALOG } from "./catalog";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const slugify = (s: string) => norm(s).replace(/\s+/g, "-");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Exact catalog item name (normalized) -> WebP photo slug in /public/photos. */
export const CATALOG_PHOTOS: Record<string, string> = Object.fromEntries(
  CATALOG.map((item) => [norm(item.name), slugify(item.name)]),
);

/**
 * Colloquial Indonesian aliases and shorter base words for items typed manually
 * outside the exact catalog list. Ordered specific-first.
 */
const ALIASES: [string[], string][] = [
  [["cabe rawit", "cabai rawit"], "cabai-rawit"],
  [["cabe keriting", "cabai keriting"], "cabai-keriting"],
  [["cabe hijau", "cabe ijo", "cabai ijo"], "cabai-hijau"],
  [["cabe merah", "cabe", "cabai", "lombok"], "cabai-merah-besar"],
  [["terung", "terong"], "terong"],
  [["mentimun", "ketimun"], "timun"],
  [["kubis"], "kol"],
  [["bawang bombai"], "bawang-bombay"],
  [["telor ayam", "telor", "telur"], "telur-ayam"],
  [["mi instan", "indomie", "mie goreng", "mie kuah"], "mie-instan"],
  [["spageti", "spaghetti", "makaroni"], "pasta"],
  [["strawberry"], "stroberi"],
  [["yoghurt"], "yogurt"],
  [["coklat"], "cokelat-batang"],
  [["odol", "pepsodent"], "pasta-gigi"],
  [["shampo"], "sampo"],
  [["sunlight"], "sabun-cuci-piring"],
  [["rinso", "detergen", "deterjen"], "deterjen-bubuk"],
  [["blue band"], "margarin"],
  [["pampers", "popok"], "popok-bayi"],
  [["tissue", "tisu"], "tisu-wajah"],
  [["aqua", "air putih"], "air-mineral"],
  [["galon"], "galon-isi-ulang"],
  [["elpiji", "lpg", "gas"], "gas-elpiji"],
  [["whiskas", "pakan kucing"], "makanan-kucing"],
  [["terigu"], "tepung-terigu"],
  [["maizena"], "tepung-maizena"],
  [["tapioka", "kanji", "aci"], "tepung-tapioka"],
  [["merica", "lada"], "merica-bubuk"],
  [["msg"], "micin"],
  [["sambal"], "saus-sambal"],
  [["kecap"], "kecap-manis"],
  [["saus"], "saus-tomat"],
  [["minyak"], "minyak-goreng"],
  [["gula"], "gula-pasir"],
  [["ayam"], "ayam-potong"],
  [["daging", "sapi"], "daging-sapi"],
  [["ikan"], "ikan-kembung"],
  [["cumi", "sotong"], "cumi-cumi"],
  [["kerang"], "kerang-hijau"],
  [["susu"], "susu-uht"],
  [["kopi"], "kopi-bubuk"],
  [["teh"], "teh-celup"],
  [["roti"], "roti-tawar"],
  [["tepung"], "tepung-terigu"],
  [["sabun"], "sabun-mandi"],
  [["baterai", "batere", "batre"], "baterai-aa"],
  [["lampu"], "lampu-led"],
  [["plastik", "kresek"], "kantong-plastik"],
  [["kacang"], "kacang-tanah"],
  [["jamur"], "jamur-tiram"],
  [["sawi"], "sawi-hijau"],
  [["keripik"], "keripik-kentang"],
  [["obat"], "obat-sakit-kepala"],
];

// Longest catalog names first so "pasta gigi" matches before "pasta",
// "bawang putih" before "bawang", "jambu air" before "air", etc.
const CATALOG_PHRASES: [RegExp, string][] = Object.entries(CATALOG_PHOTOS)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([phrase, slug]) => [new RegExp(`(^|[^a-z0-9])${escape(phrase)}($|[^a-z0-9])`), slug]);

const ALIAS_MATCHERS: [RegExp, string][] = ALIASES.map(([words, slug]) => [
  new RegExp(`(^|[^a-z0-9])(${words.map(escape).join("|")})($|[^a-z0-9])`),
  slug,
]);

/** Local photo path (`/photos/<slug>.webp`) for a grocery item, or null if unmatched. */
export function itemPhoto(name: string): string | null {
  const n = norm(name);
  if (!n) return null;

  const exact = CATALOG_PHOTOS[n];
  if (exact) return `/photos/${exact}.webp`;

  for (const [re, slug] of CATALOG_PHRASES) if (re.test(n)) return `/photos/${slug}.webp`;
  for (const [re, slug] of ALIAS_MATCHERS) if (re.test(n)) return `/photos/${slug}.webp`;

  return null;
}

/** All photo slugs referenced by catalog entries and aliases (used in tests). */
export const ALL_PHOTO_SLUGS: string[] = Array.from(
  new Set([...Object.values(CATALOG_PHOTOS), ...ALIASES.map(([, slug]) => slug)]),
);

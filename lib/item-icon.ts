import { categoryOf } from "./constants";
import { ICON_FILES } from "./icon-assets";

/**
 * Keyword → picture for common Indonesian groceries. Checked in order, so put
 * specific phrases ("telur ayam", "bawang putih") before general ones ("ayam").
 */
const KEYWORDS: [string[], string][] = [
  [["bawang putih"], "🧄"],
  [["bawang merah", "bawang bombay", "bawang bombai", "bawang"], "🧅"],
  [["telur", "telor"], "🥚"],
  [["cabai", "cabe", "lombok"], "🌶️"],
  [["tomat"], "🍅"],
  [["wortel"], "🥕"],
  [["kentang"], "🥔"],
  [["jagung"], "🌽"],
  [["timun", "mentimun", "ketimun"], "🥒"],
  [["terong", "terung"], "🍆"],
  [["brokoli"], "🥦"],
  [["bayam", "kangkung", "sawi", "selada", "kol", "kubis", "pakcoy", "daun"], "🥬"],
  [["jamur"], "🍄"],
  [["jahe", "kunyit", "lengkuas", "kencur"], "🫚"],
  [["kacang"], "🥜"],
  [["alpukat"], "🥑"],
  [["pisang"], "🍌"],
  [["apel"], "🍎"],
  [["jeruk", "lemon", "nipis"], "🍊"],
  [["mangga"], "🥭"],
  [["semangka"], "🍉"],
  [["anggur"], "🍇"],
  [["stroberi", "strawberry"], "🍓"],
  [["nanas"], "🍍"],
  [["kelapa", "santan"], "🥥"],
  [["melon"], "🍈"],
  [["pir"], "🍐"],
  [["beras", "nasi"], "🍚"],
  [["mie", "mi instan", "indomie", "bihun", "pasta", "spageti"], "🍜"],
  [["roti"], "🍞"],
  [["tepung", "terigu", "maizena"], "🌾"],
  [["gula"], "🍬"],
  [["garam", "merica", "lada", "penyedap", "kaldu", "micin", "msg", "ketumbar", "bumbu"], "🧂"],
  [["kecap", "saus", "sambal"], "🥫"],
  [["minyak"], "🫗"],
  [["mentega", "margarin", "blue band"], "🧈"],
  [["keju"], "🧀"],
  [["ayam", "bebek"], "🍗"],
  [["daging", "sapi", "kambing", "rendang"], "🥩"],
  [["sosis", "nugget", "bakso", "kornet"], "🌭"],
  [["udang"], "🦐"],
  [["cumi", "sotong"], "🦑"],
  [["kepiting", "rajungan"], "🦀"],
  [["ikan", "lele", "tongkol", "bandeng", "nila", "tuna", "salmon", "kakap", "teri", "gurame"], "🐟"],
  [["susu", "yogurt", "yoghurt"], "🥛"],
  [["kopi"], "☕"],
  [["teh"], "🍵"],
  [["air mineral", "aqua", "galon", "air"], "💧"],
  [["jus", "sirup", "soda", "minuman"], "🧃"],
  [["es krim"], "🍨"],
  [["cokelat", "coklat"], "🍫"],
  [["biskuit", "kue", "wafer", "roti kering"], "🍪"],
  [["keripik", "kerupuk", "chiki", "snack"], "🍿"],
  [["madu"], "🍯"],
  [["sabun", "sampo", "shampo", "sikat gigi", "pasta gigi", "odol"], "🧴"],
  [["tisu", "tissue", "toilet"], "🧻"],
  [["deterjen", "detergen", "pewangi", "pelembut", "rinso", "pembersih", "sunlight", "spons"], "🧽"],
  [["pembalut", "popok", "pampers"], "🩲"],
  [["obat", "vitamin", "plester"], "💊"],
  [["lampu", "baterai"], "💡"],
  [["gas", "elpiji", "lpg"], "🔥"],
  [["plastik", "kantong", "trash bag"], "🛍️"],
  [["makanan kucing", "makanan anjing", "whiskas", "pakan"], "🐾"],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = KEYWORDS.map(
  ([words, icon]) => [new RegExp(`(^|[^a-z])(${words.map(escape).join("|")})($|[^a-z])`), icon] as const,
);

export function iconFor(name: string, category: string): string {
  const n = name.toLowerCase();
  for (const [re, icon] of MATCHERS) if (re.test(n)) return icon;
  return categoryOf(category).emoji;
}

/** Path of the 3D picture for an item, or null when only the emoji exists. */
export function iconImage(name: string, category: string): string | null {
  const file = ICON_FILES[iconFor(name, category)];
  return file ? `/icons/${file}.png` : null;
}

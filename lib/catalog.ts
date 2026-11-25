/**
 * Common Indonesian household groceries, so items can be tapped instead of typed.
 * Each entry fills category, unit and a starting quantity. No prices: market
 * prices vary by region and week, so the family enters their own.
 *
 * Format per line: "Name|unit|quantity" (unit defaults to pcs, quantity to 1).
 */
const RAW: Record<string, string[]> = {
  staple: [
    "Beras|kg|5", "Beras merah|kg|1", "Ketan putih|kg|1", "Ketan hitam|kg|1", "Tepung terigu|kg|1",
    "Tepung beras|bungkus", "Tepung tapioka|bungkus", "Tepung maizena|bungkus", "Tepung roti|bungkus",
    "Mie instan|bungkus|5", "Mie telur|bungkus", "Bihun|bungkus", "Soun|bungkus", "Kwetiau|bungkus",
    "Pasta|bungkus", "Roti tawar|bungkus", "Roti gandum|bungkus", "Oatmeal|bungkus", "Sereal|kotak",
    "Kentang|kg|1", "Ubi|kg|1", "Singkong|kg|1", "Jagung pipil|kg|0.5", "Kacang hijau|kg|0.5",
    "Kacang merah|kg|0.5", "Kacang tanah|kg|0.5", "Kacang kedelai|kg|0.5",
  ],
  vegetable: [
    "Bayam|ikat|2", "Kangkung|ikat|2", "Sawi hijau|ikat", "Sawi putih|pcs", "Pakcoy|ikat", "Selada|ikat",
    "Kol|pcs", "Brokoli|pcs", "Kembang kol|pcs", "Wortel|kg|0.5", "Tomat|kg|0.5", "Timun|kg|0.5",
    "Terong|kg|0.5", "Labu siam|pcs|2", "Buncis|ikat", "Kacang panjang|ikat", "Tauge|bungkus",
    "Jagung manis|pcs|2", "Jamur kancing|bungkus", "Jamur tiram|bungkus", "Jamur enoki|bungkus",
    "Daun singkong|ikat", "Daun pepaya|ikat", "Pare|pcs|2", "Oyong|pcs|2", "Paprika|pcs", "Kailan|ikat",
    "Daun bawang|ikat", "Seledri|ikat", "Kemangi|ikat", "Selada air|ikat", "Rebung|bungkus",
    "Nangka muda|bungkus", "Melinjo|bungkus", "Petai|papan", "Jengkol|kg|0.25", "Sayur asem|bungkus",
    "Sayur sop|bungkus", "Cabai merah besar|gram|250", "Cabai keriting|gram|250", "Cabai rawit|gram|100",
    "Cabai hijau|gram|100",
  ],
  fruit: [
    "Pisang|sisir", "Apel|kg|1", "Jeruk|kg|1", "Jeruk nipis|gram|250", "Lemon|pcs|2", "Mangga|kg|1",
    "Pepaya|pcs", "Semangka|pcs", "Melon|pcs", "Nanas|pcs", "Anggur|kg|0.5", "Stroberi|pack",
    "Alpukat|kg|1", "Salak|kg|1", "Rambutan|ikat", "Duku|kg|1", "Manggis|kg|1", "Durian|pcs",
    "Jambu biji|kg|1", "Jambu air|kg|1", "Belimbing|kg|0.5", "Pir|kg|1", "Kelengkeng|kg|0.5",
    "Buah naga|kg|1", "Kiwi|pcs|4", "Kurma|bungkus", "Sirsak|pcs", "Markisa|kg|0.5", "Kelapa muda|pcs",
  ],
  meat: [
    "Ayam potong|kg|1", "Ayam fillet|kg|0.5", "Paha ayam|kg|1", "Sayap ayam|kg|0.5", "Ati ampela|pcs|5",
    "Ceker ayam|kg|0.5", "Daging sapi|kg|0.5", "Daging giling|kg|0.5", "Iga sapi|kg|0.5",
    "Tetelan sapi|kg|0.5", "Daging kambing|kg|0.5", "Bebek|ekor", "Sosis|pack", "Nugget ayam|pack",
    "Bakso sapi|pack", "Kornet|kaleng", "Telur ayam|kg|1", "Telur bebek|butir|5", "Telur puyuh|pack",
    "Tahu|pcs|5", "Tempe|papan", "Tahu putih|pcs|5", "Oncom|papan",
  ],
  seafood: [
    "Ikan kembung|kg|0.5", "Ikan tongkol|kg|0.5", "Ikan lele|kg|1", "Ikan nila|kg|1", "Ikan bandeng|kg|1",
    "Ikan gurame|ekor", "Ikan kakap|kg|0.5", "Ikan salmon|gram|250", "Ikan tuna|gram|250",
    "Ikan teri|gram|250", "Ikan asin|gram|250", "Ikan patin|kg|1", "Ikan mujair|kg|1", "Ikan kerapu|kg|0.5",
    "Udang|kg|0.5", "Udang rebon|gram|100", "Cumi-cumi|kg|0.5", "Kepiting|kg|0.5", "Kerang hijau|kg|1",
    "Kerang dara|kg|0.5", "Ikan sarden|kaleng", "Bakso ikan|pack", "Otak-otak|pack",
  ],
  cooking: [
    "Minyak goreng|liter|2", "Minyak kelapa|liter|1", "Minyak zaitun|botol", "Mentega|pcs",
    "Margarin|pcs", "Santan kara|pcs|2", "Kelapa parut|bungkus", "Gula pasir|kg|1", "Gula merah|kg|0.5",
    "Gula aren|kg|0.5", "Garam|bungkus", "Kecap manis|botol", "Kecap asin|botol", "Saus tomat|botol",
    "Saus sambal|botol", "Saus tiram|botol", "Saus teriyaki|botol", "Mayones|pcs", "Cuka|botol",
    "Susu kental manis|kaleng", "Keju|pcs", "Ragi|bungkus", "Baking powder|pcs", "Pengembang kue|pcs",
    "Cokelat bubuk|bungkus", "Agar-agar|bungkus|2", "Gelatin|bungkus", "Vanili|bungkus",
    "Madu|botol", "Selai|pcs", "Meses|bungkus",
    "Kerupuk mentah|bungkus", "Bawang goreng|bungkus", "Tepung bumbu|bungkus|2",
  ],
  spice: [
    "Bawang merah|gram|250", "Bawang putih|gram|250", "Bawang bombay|pcs|2", "Jahe|gram|100",
    "Kunyit|gram|100", "Lengkuas|gram|100", "Kencur|gram|100", "Serai|ikat", "Daun salam|ikat",
    "Daun jeruk|ikat", "Daun pandan|ikat", "Kemiri|gram|100", "Ketumbar|bungkus", "Merica bubuk|bungkus",
    "Merica butir|bungkus", "Jintan|bungkus", "Pala|bungkus", "Cengkeh|bungkus", "Kayu manis|bungkus",
    "Bunga lawang|bungkus", "Kapulaga|bungkus", "Asam jawa|bungkus", "Terasi|pcs", "Petis|pcs",
    "Penyedap rasa|bungkus", "Kaldu ayam bubuk|bungkus", "Kaldu sapi bubuk|bungkus", "Micin|bungkus",
    "Bumbu nasi goreng|bungkus|2", "Bumbu rendang|bungkus", "Bumbu soto|bungkus", "Bumbu opor|bungkus",
    "Bumbu kari|bungkus", "Bumbu rawon|bungkus", "Bumbu gulai|bungkus", "Sambal terasi|botol",
    "Cabai bubuk|bungkus", "Oregano|botol",
  ],
  drink: [
    "Air mineral|botol|6", "Air mineral kardus|dus", "Teh celup|kotak", "Teh tubruk|bungkus",
    "Kopi bubuk|bungkus", "Kopi sachet|renteng", "Kopi instan|bungkus", "Susu UHT|liter|2",
    "Susu bubuk|kotak", "Susu kedelai|botol", "Yogurt|pcs|4", "Jus buah|kotak", "Sirup|botol",
    "Minuman soda|botol", "Minuman isotonik|botol", "Teh kotak|pcs|6", "Cokelat minuman|bungkus",
    "Susu anak|kotak", "Krimer|bungkus", "Es batu|bungkus", "Air mineral galon|galon",
  ],
  snack: [
    "Biskuit|bungkus", "Wafer|bungkus", "Keripik kentang|bungkus", "Keripik singkong|bungkus",
    "Kerupuk|bungkus", "Kacang atom|bungkus", "Cokelat batang|pcs", "Permen|bungkus", "Roti manis|pcs|4",
    "Kue kering|toples", "Es krim|pcs|4", "Puding|pcs|4", "Agar-agar jadi|pcs", "Popcorn|bungkus",
    "Rempeyek|bungkus", "Kacang mete|bungkus", "Sereal batang|pcs|4", "Marshmallow|bungkus",
    "Kue basah|pcs|5", "Lapis legit|kotak",
  ],
  bathroom: [
    "Sabun mandi|pcs|2", "Sabun cair|botol", "Sampo|botol", "Kondisioner|botol", "Pasta gigi|pcs|2",
    "Sikat gigi|pcs|2", "Obat kumur|botol", "Benang gigi|pcs", "Deodoran|pcs", "Sabun cuci muka|pcs",
    "Pelembap|pcs", "Tabir surya|pcs", "Losion|botol", "Cotton bud|pack", "Kapas|pack", "Pisau cukur|pack",
    "Tisu toilet|pack", "Tisu wajah|pack", "Tisu basah|pack", "Pembalut|pack", "Popok bayi|pack",
    "Minyak telon|botol", "Bedak bayi|pcs", "Sabun bayi|botol", "Sampo bayi|botol", "Hand sanitizer|botol",
    "Sabun cuci tangan|botol", "Plester luka|pack", "Minyak kayu putih|botol", "Obat nyamuk oles|pcs",
  ],
  cleaning: [
    "Sabun cuci piring|botol", "Spons cuci piring|pack", "Sabut kawat|pcs", "Deterjen bubuk|bungkus",
    "Deterjen cair|botol", "Pelembut pakaian|bungkus", "Pewangi pakaian|botol", "Pemutih pakaian|botol",
    "Pembersih lantai|botol", "Pembersih kaca|botol", "Pembersih kamar mandi|botol", "Karbol|botol",
    "Kamper|pack", "Pengharum ruangan|pcs", "Obat nyamuk bakar|kotak", "Obat nyamuk semprot|kaleng",
    "Kantong sampah|pack", "Sapu|pcs", "Pel lantai|pcs", "Lap kain|pcs|3", "Sikat lantai|pcs",
    "Sarung tangan karet|pasang", "Tisu dapur|pack", "Pembersih kerak|botol", "Sabun colek|pcs",
  ],
  household: [
    "Baterai AA|pack", "Baterai AAA|pack", "Lampu LED|pcs", "Korek api|pcs", "Lilin|pack",
    "Plastik wrap|rol", "Aluminium foil|rol", "Kertas roti|rol", "Kantong plastik|pack",
    "Plastik klip|pack", "Tusuk gigi|pack", "Sedotan|pack", "Sumpit|pack", "Piring kertas|pack",
    "Gelas plastik|pack", "Galon isi ulang|galon", "Gas elpiji|tabung", "Token listrik|pcs", "Pulsa|pcs", "Isolasi|rol",
    "Lakban|rol", "Gunting|pcs", "Sendok plastik|pack", "Makanan kucing|bungkus", "Pasir kucing|bungkus",
    "Makanan ikan|pcs", "Pupuk tanaman|bungkus", "Obat sakit kepala|strip", "Vitamin|botol",
    "Obat batuk|botol", "Masker|kotak",
  ],
};

export type CatalogItem = { name: string; category: string; unit: string; quantity: number };

export const CATALOG: CatalogItem[] = Object.entries(RAW).flatMap(([category, lines]) =>
  lines.map((line) => {
    const [name, unit = "pcs", qty = "1"] = line.split("|");
    return { name, category, unit, quantity: Number(qty) };
  }),
);

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const INDEX = CATALOG.map((item) => ({ item, key: norm(item.name), words: norm(item.name).split(/[\s-]+/) }));

/**
 * Items matching what the user is typing. Order: names that start with the query,
 * then names with a word that starts with it, then names containing it.
 */
export function searchCatalog(query: string, limit = 8): CatalogItem[] {
  const q = norm(query);
  if (!q) return [];
  const scored: { item: CatalogItem; rank: number }[] = [];
  for (const { item, key, words } of INDEX) {
    const rank = key.startsWith(q) ? 0 : words.some((w) => w.startsWith(q)) ? 1 : key.includes(q) ? 2 : -1;
    if (rank >= 0) scored.push({ item, rank });
  }
  scored.sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name, "id"));
  return scored.slice(0, limit).map((s) => s.item);
}

export function findCatalogItem(name: string): CatalogItem | undefined {
  const q = norm(name);
  return INDEX.find((x) => x.key === q)?.item;
}

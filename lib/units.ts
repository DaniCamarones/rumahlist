/**
 * Prices are stored per quantity unit (so total = price × quantity), but people
 * think of gram items in Rp/kg and ml items in Rp/liter. These helpers convert.
 */
const LARGER: Record<string, { label: string; factor: number }> = {
  gram: { label: "kg", factor: 1000 },
  ml: { label: "liter", factor: 1000 },
};

export function priceUnit(unit: string): { label: string; factor: number } {
  return LARGER[unit] ?? { label: unit, factor: 1 };
}

/** Rp per display unit (e.g. per kg) → Rp per quantity unit (per gram). */
export function toStoredPrice(display: number, unit: string): number {
  return Math.round((display / priceUnit(unit).factor) * 1000) / 1000;
}

/** Rp per quantity unit → Rp per display unit, rounded to whole rupiah. */
export function toDisplayPrice(stored: number | null, unit: string): number | null {
  return stored == null ? null : Math.round(stored * priceUnit(unit).factor);
}

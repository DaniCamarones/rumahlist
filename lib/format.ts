const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(n: number): string {
  // id-ID inserts a non-breaking space after "Rp"; the app style is "Rp150.000".
  return rupiah.format(Math.round(n)).replace(/\s/g, "");
}

const MULTIPLIERS: Record<string, number> = {
  rb: 1_000,
  ribu: 1_000,
  k: 1_000,
  jt: 1_000_000,
  juta: 1_000_000,
};

/** Parses "28000", "28.000", "Rp28.000", "28rb", "15k", "1,5jt". */
export function parseRupiah(input: string): number | null {
  const s = input.toLowerCase().replace(/rp/g, "").replace(/\s/g, "");
  const m = s.match(/^(\d+(?:[.,]\d+)*)(rb|ribu|k|jt|juta)?$/);
  if (!m) return null;
  const [, num, suffix] = m;
  if (suffix) {
    const value = parseFloat(num.replace(",", "."));
    return Number.isFinite(value) ? Math.round(value * MULTIPLIERS[suffix]) : null;
  }
  // Without a suffix, dots are thousand separators and a comma is the decimal mark.
  const value = parseFloat(num.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function formatQty(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);
}

/** "250 gram", or "? gram" when the quantity is still to be decided. */
export function formatAmount(quantity: number | null, unit: string): string {
  return `${quantity === null ? "?" : formatQty(quantity)} ${unit}`;
}

export function formatDate(iso: string, withTime = false): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(iso);
}

import type { ItemStatus, Priority, Role } from "./types";

export const CATEGORIES = [
  { id: "staple", label: "Beras & bahan pokok", emoji: "🍚" },
  { id: "vegetable", label: "Sayuran", emoji: "🥬" },
  { id: "fruit", label: "Buah", emoji: "🍌" },
  { id: "meat", label: "Daging & unggas", emoji: "🍗" },
  { id: "seafood", label: "Ikan & seafood", emoji: "🐟" },
  { id: "cooking", label: "Bahan masak", emoji: "🧈" },
  { id: "spice", label: "Bumbu", emoji: "🧂" },
  { id: "drink", label: "Minuman", emoji: "🥤" },
  { id: "snack", label: "Camilan", emoji: "🍪" },
  { id: "bathroom", label: "Kamar mandi", emoji: "🧴" },
  { id: "cleaning", label: "Kebersihan", emoji: "🧽" },
  { id: "household", label: "Keperluan rumah", emoji: "🏠" },
  { id: "other", label: "Lainnya", emoji: "📦" },
] as const;

export function categoryOf(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export const UNITS = [
  "kg", "gram", "liter", "ml", "pcs", "pack", "botol", "dus", "ikat", "sisir", "butir", "bungkus",
];

export const PRIORITIES: { id: Priority; label: string; rank: number }[] = [
  { id: "urgent", label: "Mendesak", rank: 0 },
  { id: "normal", label: "Normal", rank: 1 },
  { id: "optional", label: "Opsional", rank: 2 },
];

export const STATUSES: { id: ItemStatus; label: string }[] = [
  { id: "pending", label: "Belum dibeli" },
  { id: "purchased", label: "Dibeli" },
  { id: "unavailable", label: "Tidak tersedia" },
  { id: "cancelled", label: "Batal" },
];

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: "owner", label: "Pemilik", description: "Kendali penuh, kelola anggota" },
  { id: "admin", label: "Admin", description: "Kelola daftar & lihat aktivitas" },
  { id: "member", label: "Anggota", description: "Tambah, centang, catat belanja" },
  { id: "viewer", label: "Pemantau", description: "Hanya bisa melihat" },
];

export const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)?.label ?? r;

export const PAYMENT_METHODS = ["Tunai", "QRIS", "Debit", "Kartu kredit", "Transfer", "E-wallet"];

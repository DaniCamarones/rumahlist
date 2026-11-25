"use client";

import { useState } from "react";
import { CATEGORIES, PRIORITIES, UNITS } from "@/lib/constants";
import { formatRupiah, parseRupiah } from "@/lib/format";
import { errorText, supabase } from "@/lib/supabase/client";
import { priceUnit, toDisplayPrice, toStoredPrice } from "@/lib/units";
import type { Priority, ShoppingItem } from "@/lib/types";
import { useHousehold } from "./household-provider";
import { ItemSuggestInput } from "./item-suggest-input";
import { useToast } from "./toast";

type Draft = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  customUnit: string;
  price: string;
  priority: Priority;
  assigned_to: string;
  notes: string;
};

const fromItem = (i?: Partial<ShoppingItem>): Draft => ({
  name: i?.name ?? "",
  category: i?.category ?? "other",
  quantity: String(i?.quantity ?? 1).replace(".", ","),
  unit: i?.unit && !UNITS.includes(i.unit) ? "__custom" : (i?.unit ?? "pcs"),
  customUnit: i?.unit && !UNITS.includes(i.unit) ? i.unit : "",
  price: i?.estimated_price != null ? String(toDisplayPrice(i.estimated_price, i.unit ?? "pcs")) : "",
  priority: i?.priority ?? "normal",
  assigned_to: i?.assigned_to ?? "",
  notes: i?.notes ?? "",
});

export function ItemForm({
  item,
  initial,
  onDone,
}: {
  item?: ShoppingItem;
  initial?: Partial<ShoppingItem>;
  onDone: () => void;
}) {
  const { household, members, userId } = useHousehold();
  const toast = useToast();
  const [d, setD] = useState<Draft>(() => fromItem(item ?? initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const qty = Number(d.quantity.replace(",", "."));
  const price = d.price.trim() ? parseRupiah(d.price) : null;
  const unit = d.unit === "__custom" ? d.customUnit.trim() : d.unit;
  const per = priceUnit(unit || "satuan");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) return setError("Nama barang wajib diisi.");
    if (!Number.isFinite(qty) || qty <= 0) return setError("Jumlah harus lebih dari 0.");
    if (d.price.trim() && price === null) return setError("Harga tidak dikenali. Contoh: 15000, 15rb, 1,5jt.");
    if (!unit) return setError("Isi satuan.");
    setBusy(true);
    setError(null);
    const row = {
      name: d.name.trim(),
      category: d.category,
      quantity: qty,
      unit,
      estimated_price: price === null ? null : toStoredPrice(price, unit),
      priority: d.priority,
      assigned_to: d.assigned_to || null,
      notes: d.notes.trim() || null,
    };
    const db = supabase();
    const { error } = item
      ? await db.from("shopping_items").update(row).eq("id", item.id)
      : await db.from("shopping_items").insert({ ...row, household_id: household.id, added_by: userId });
    setBusy(false);
    if (error) return setError(errorText(error));
    toast(item ? "Perubahan disimpan" : `${row.name} ditambahkan`);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="f-name">Nama barang</label>
        <ItemSuggestInput id="f-name" autoFocus={!item} placeholder="Ketik, lalu pilih dari saran"
          value={d.name} onChange={(v) => set("name", v.slice(0, 80))}
          onPick={(c) =>
            setD((x) => ({
              ...x,
              name: c.name,
              category: c.category,
              quantity: String(c.quantity).replace(".", ","),
              unit: UNITS.includes(c.unit) ? c.unit : "__custom",
              customUnit: UNITS.includes(c.unit) ? "" : c.unit,
            }))
          } />
        <p className="mt-1 text-xs text-muted">Pilih dari saran untuk mengisi kategori dan satuan otomatis. Semua tetap bisa diubah.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-qty">Jumlah</label>
          <input id="f-qty" inputMode="decimal" className="field" value={d.quantity}
            onChange={(e) => set("quantity", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="f-unit">Satuan</label>
          <select id="f-unit" className="field" value={d.unit} onChange={(e) => set("unit", e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            <option value="__custom">Lainnya…</option>
          </select>
        </div>
      </div>
      {d.unit === "__custom" && (
        <input aria-label="Satuan lain" placeholder="mis. renteng, karung" maxLength={20} className="field"
          value={d.customUnit} onChange={(e) => set("customUnit", e.target.value)} />
      )}

      <div>
        <label className="label" htmlFor="f-price">Perkiraan harga per {per.label}</label>
        <input id="f-price" inputMode="numeric" placeholder="mis. 15000 atau 15rb" className="field"
          value={d.price} onChange={(e) => set("price", e.target.value)} />
        {price !== null && qty > 0 && (
          <p className="mt-1 text-xs text-muted">
            {formatRupiah(price)}/{per.label} × {d.quantity} {unit} ={" "}
            <b className="text-ink">{formatRupiah(toStoredPrice(price, unit) * qty)}</b>
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="f-cat">Kategori</label>
        <select id="f-cat" className="field" value={d.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      <fieldset>
        <legend className="label">Prioritas</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button type="button" key={p.id} onClick={() => set("priority", p.id)} aria-pressed={d.priority === p.id}
              className={`min-h-11 border-[1.5px] font-mono text-[14px] ${
                d.priority === p.id
                  ? p.id === "urgent" ? "border-danger bg-danger text-white" : "border-ink bg-ink text-white"
                  : "border-ink/35 bg-paper text-ink hover:border-ink"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="f-assign">Yang membelikan</label>
        <select id="f-assign" className="field" value={d.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}>
          <option value="">Siapa saja</option>
          {members.filter((m) => m.role !== "viewer").map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.user_id === userId ? `${m.display_name} (kamu)` : m.display_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-notes">Catatan</label>
        <textarea id="f-notes" rows={2} maxLength={300} placeholder="mis. merek Rose Brand, yang 2 liter"
          className="field" value={d.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      {error && <p role="alert" className="bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Menyimpan…" : item ? "Simpan perubahan" : "Tambah ke daftar"}
      </button>
    </form>
  );
}

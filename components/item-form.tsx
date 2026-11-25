"use client";

import { useState } from "react";
import { CATEGORIES, PRIORITIES, UNITS } from "@/lib/constants";
import { formatDate, formatRupiah, formatAmount, parseRupiah } from "@/lib/format";
import { prefillFor, type Prefill } from "@/lib/prefill";
import { priceUnit, toDisplayPrice, toStoredPrice } from "@/lib/units";
import type { Priority, ShoppingItem } from "@/lib/types";
import { useApp } from "./app-provider";
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
  notes: string;
};

const qtyText = (q: number | null | undefined) => (q == null ? "" : String(q).replace(".", ","));
const unitFields = (unit: string) =>
  unit && !UNITS.includes(unit) ? { unit: "__custom", customUnit: unit } : { unit, customUnit: "" };
const priceText = (price: number | null | undefined, unit: string) =>
  price != null ? String(toDisplayPrice(price, unit || "pcs")) : "";

function fromItem(i: ShoppingItem): Draft {
  return {
    name: i.name,
    category: i.category,
    quantity: qtyText(i.quantity),
    ...unitFields(i.unit),
    price: priceText(i.estimated_price, i.unit),
    priority: i.priority,
    notes: i.notes ?? "",
  };
}

function fromPrefill(p: Prefill): Draft {
  return {
    name: p.name,
    category: p.category,
    quantity: qtyText(p.quantity),
    ...unitFields(p.unit),
    price: priceText(p.estimated_price, p.unit),
    priority: "normal",
    notes: "",
  };
}

/**
 * Add or edit one item. Quantity may stay empty ("belum tahu") and is then filled
 * in while shopping. Unit and category are tapped, not picked from a dropdown.
 */
export function ItemForm({ item, prefill, onDone }: { item?: ShoppingItem; prefill?: Prefill; onDone: () => void }) {
  const app = useApp();
  const toast = useToast();
  const [d, setD] = useState<Draft>(() => (item ? fromItem(item) : fromPrefill(prefill ?? prefillFor(app.state, ""))));
  const [last, setLast] = useState(prefill?.last ?? null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const qtyRaw = d.quantity.trim();
  const qty = qtyRaw ? Number(qtyRaw.replace(",", ".")) : null;
  const price = d.price.trim() ? parseRupiah(d.price) : null;
  const unit = d.unit === "__custom" ? d.customUnit.trim() : d.unit;
  const per = priceUnit(unit || "pcs");

  function pickName(name: string) {
    const p = prefillFor(app.state, name);
    setD((x) => ({ ...fromPrefill(p), priority: x.priority, notes: x.notes }));
    setLast(p.last);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) return setError("Nama barang wajib diisi.");
    if (qty !== null && (!Number.isFinite(qty) || qty <= 0)) return setError("Jumlah harus angka lebih dari 0, atau kosongkan.");
    if (d.price.trim() && price === null) return setError("Harga tidak dikenali. Contoh: 15000, 15rb, 1,5jt.");
    if (d.unit === "__custom" && !unit) return setError("Tulis satuannya, atau pilih satuan lain.");
    const row = {
      name: d.name.trim(),
      category: d.category || "other",
      quantity: qty,
      unit: unit || "pcs",
      estimated_price: price === null ? null : toStoredPrice(price, unit || "pcs"),
      priority: d.priority,
      notes: d.notes.trim() || null,
    };
    try {
      if (item) app.update(item.id, row);
      else app.add(row);
    } catch (err) {
      return setError((err as Error).message);
    }
    toast(item ? "Perubahan disimpan" : `${row.name} ditambahkan`);
    onDone();
  }

  const isNew = !item;
  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label" htmlFor="f-name">Nama barang</label>
        <ItemSuggestInput id="f-name" autoFocus={isNew && !d.name} placeholder="Ketik, lalu pilih dari saran"
          value={d.name} onChange={(v) => set("name", v.slice(0, 80))} onPick={(c) => pickName(c.name)} />
      </div>

      {isNew && last && (
        <div className="border-[1.5px] border-dashed border-ink/50 px-3 py-2 font-mono text-[13px]">
          <p className="font-semibold">Terakhir dibeli {formatDate(last.shopped_at)}</p>
          <p className="text-muted">
            {formatAmount(last.quantity, last.unit)}
            {last.price != null && <> · {formatRupiah(toDisplayPrice(last.price, last.unit)!)}/{priceUnit(last.unit).label}</>}
          </p>
        </div>
      )}

      <div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="f-qty">Jumlah</label>
            <input id="f-qty" inputMode="decimal" autoFocus={isNew && !!d.name} className="field font-mono text-[17px]"
              placeholder="belum tahu" value={d.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="f-unit">Satuan</label>
            <select id="f-unit" className="field" value={d.unit} onChange={(e) => set("unit", e.target.value)}>
              {!d.unit && <option value="">Pilih satuan</option>}
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">Lainnya…</option>
            </select>
          </div>
        </div>
        <p className="mt-1 text-[13px] text-muted">Belum tahu berapa? Kosongkan jumlahnya, isi nanti saat belanja.</p>
        {d.unit === "__custom" && (
          <input aria-label="Satuan lain" placeholder="mis. renteng, karung, papan" maxLength={20} className="field mt-2"
            value={d.customUnit} onChange={(e) => set("customUnit", e.target.value)} />
        )}
      </div>

      <div>
        <label className="label" htmlFor="f-cat">Kategori</label>
        <select id="f-cat" className="field" value={d.category} onChange={(e) => set("category", e.target.value)}>
          {!d.category && <option value="">Pilih kategori</option>}
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-price">Perkiraan harga per {per.label} (boleh kosong)</label>
        <input id="f-price" inputMode="numeric" placeholder="mis. 15000 atau 15rb" className="field font-mono"
          value={d.price} onChange={(e) => set("price", e.target.value)} />
        {price !== null && qty !== null && qty > 0 && (
          <p className="mt-1 font-mono text-[12.5px] text-muted">
            {formatRupiah(price)}/{per.label} × {formatAmount(qty, unit || "pcs")} ={" "}
            <b className="text-ink">{formatRupiah(toStoredPrice(price, unit || "pcs") * qty)}</b>
          </p>
        )}
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
        <label className="label" htmlFor="f-notes">Catatan</label>
        <textarea id="f-notes" rows={2} maxLength={300} placeholder="mis. merek Rose Brand, yang 2 liter"
          className="field" value={d.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      {error && <p role="alert" className="bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button className="btn btn-primary w-full">{item ? "Simpan perubahan" : "Tambah ke daftar"}</button>
    </form>
  );
}

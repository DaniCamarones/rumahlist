"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { ItemIcon } from "@/components/item-icon";
import { PriorityBadge, SlipCheck } from "@/components/item-row";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatAmount, formatRupiah, parseRupiah } from "@/lib/format";
import { actualTotal, estimatedTotal } from "@/lib/totals";
import { priceUnit, toDisplayPrice, toStoredPrice } from "@/lib/units";
import type { ShoppingItem } from "@/lib/types";

const plain = (n: number) => formatRupiah(n).replace("Rp", "");

export default function ShoppingModePage() {
  const app = useApp();
  const items = app.state.items;
  const router = useRouter();
  const [finishOpen, setFinishOpen] = useState(false);

  const pending = items.filter((i) => i.status === "pending");
  const inCart = items.filter((i) => i.status === "purchased");
  const missing = items.filter((i) => i.status === "unavailable");

  const groups = useMemo(
    () => CATEGORIES.map((c) => ({ ...c, items: pending.filter((i) => i.category === c.id) })).filter((g) => g.items.length),
    [pending],
  );

  const cartTotal = actualTotal(inCart);
  const remainingEstimate = estimatedTotal(pending);
  const totalCount = pending.length + inCart.length;
  const progress = totalCount ? inCart.length / totalCount : 0;
  const move = (item: ShoppingItem, to: ShoppingItem["status"]) => app.setStatus(item.id, to);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-40">
      <header className="sticky top-0 z-20 border-b-[1.5px] border-ink bg-counter px-4 pt-2 pb-3">
        <Link href="/daftar" className="-ml-1 inline-flex min-h-11 items-center px-1 font-mono text-[14px] underline underline-offset-4">
          ← Daftar
        </Link>
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-mono text-[22px] leading-tight font-semibold">MODE BELANJA</h1>
          <p className="font-mono text-[14px] tabular-nums">{inCart.length}/{totalCount} di keranjang</p>
        </div>
        <div className="mt-2 h-2 border border-ink bg-paper" role="progressbar"
          aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progres belanja">
          <div className="h-full bg-ink transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <div className="px-4">
        {pending.length === 0 && inCart.length === 0 ? (
          <div className="paper torn mt-6 px-5 pt-6 pb-8">
            <p className="font-mono text-[17px] font-semibold">Tidak ada yang perlu dibeli</p>
            <p className="mt-1 text-muted">Tambahkan barang dulu di Daftar, lalu kembali ke sini.</p>
            <Link href="/daftar" className="btn btn-primary mt-4">Ke daftar</Link>
          </div>
        ) : (
          groups.length > 0 && (
            <section className="paper mt-4 px-3 pt-2 pb-1" aria-label="Belum dibeli">
              {groups.map((g, gi) => (
                <div key={g.id} className={gi > 0 ? "rule pt-2" : ""}>
                  <h2 className="slip-heading px-1 pt-1">{g.label}</h2>
                  <ul>
                    {g.items.map((i) => (
                      <li key={i.id} className="flex items-center">
                        <button onClick={() => move(i, "purchased")} role="checkbox" aria-checked={false}
                          aria-label={`Masukkan ${i.name} ke keranjang`}
                          className="flex min-h-16 flex-1 items-center gap-3 px-1 text-left active:bg-accent-soft">
                          <SlipCheck checked={false} size="lg" />
                          <ItemIcon name={i.name} category={i.category} />
                          <span className="min-w-0 flex-1 font-mono">
                            <span className="block text-[17px] leading-snug font-medium">{i.name}</span>
                            <span className="flex flex-wrap gap-x-2 text-[13px] text-muted">
                              <span>{formatAmount(i.quantity, i.unit)}</span>
                              {i.estimated_price != null && i.quantity !== null && <span>±{formatRupiah(i.estimated_price * i.quantity)}</span>}
                              <PriorityBadge priority={i.priority} />
                            </span>
                            {i.notes && <span className="block font-sans text-[13px] text-muted">“{i.notes}”</span>}
                          </span>
                        </button>
                        <button onClick={() => move(i, "unavailable")} aria-label={`${i.name} tidak tersedia`}
                          className="min-h-16 shrink-0 px-2.5 font-mono text-[12px] text-muted underline underline-offset-4 hover:text-ink">
                          Habis
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )
        )}

        {inCart.length > 0 && (
          <section className="paper torn mt-6 px-4 pt-3 pb-7" aria-label="Keranjang">
            <h2 className="slip-heading">Keranjang ({inCart.length})</h2>
            <ul>
              {inCart.map((i) => (
                <CartRow key={i.id} item={i} onUndo={() => move(i, "pending")} onPrice={(p) => app.setPrice(i.id, p)}
                  onQty={(q) => app.update(i.id, { quantity: q })} />
              ))}
            </ul>
            <div className="rule mt-1 flex items-end gap-2 pt-3 font-mono">
              <span className="font-semibold">SUBTOTAL</span>
              <span className="leader" />
              <span className="text-[18px] font-semibold tabular-nums">{plain(cartTotal)}</span>
            </div>
          </section>
        )}

        {missing.length > 0 && (
          <section className="paper mt-6 px-4 py-3" aria-label="Tidak tersedia">
            <h2 className="slip-heading">Tidak ada di toko · kembali ke daftar setelah selesai</h2>
            <ul>
              {missing.map((i) => (
                <li key={i.id} className="flex items-center gap-3 font-mono">
                  <span className="flex-1 text-muted line-through">{i.name}</span>
                  <button onClick={() => move(i, "pending")} className="min-h-11 px-1 text-[14px] text-accent underline underline-offset-4">
                    Ternyata ada
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-ink bg-paper">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex-1 font-mono">
            <p className="text-[12px] text-muted">TOTAL KERANJANG</p>
            <p className="text-[26px] leading-tight font-semibold tabular-nums">{formatRupiah(cartTotal)}</p>
            {remainingEstimate > 0 && <p className="text-[12px] text-muted">sisa ±{formatRupiah(remainingEstimate)}</p>}
          </div>
          <button className="btn btn-primary min-h-14 px-6 text-[16px]" disabled={inCart.length === 0} onClick={() => setFinishOpen(true)}>
            Selesai
          </button>
        </div>
      </div>

      <Sheet open={finishOpen} title="Selesai belanja" onClose={() => setFinishOpen(false)}>
        <FinishForm items={inCart} missingCount={missing.length} onDone={(sid) => router.push(`/riwayat/nota?id=${sid}`)} />
      </Sheet>
    </div>
  );
}

/** A cart line: the real quantity and price are typed here, at the stall. */
function CartRow({
  item,
  onUndo,
  onPrice,
  onQty,
}: {
  item: ShoppingItem;
  onUndo: () => void;
  onPrice: (p: number | null) => void;
  onQty: (q: number | null) => void;
}) {
  const toast = useToast();
  const per = priceUnit(item.unit);
  const [value, setValue] = useState(item.actual_price != null ? String(toDisplayPrice(item.actual_price, item.unit)) : "");
  const [qtyValue, setQtyValue] = useState(item.quantity != null ? String(item.quantity).replace(".", ",") : "");
  const typed = value.trim() ? parseRupiah(value) : null;
  const parsed = typed === null ? null : toStoredPrice(typed, item.unit);
  const qtyNum = qtyValue.trim() ? Number(qtyValue.trim().replace(",", ".")) : null;

  function savePrice() {
    if (value.trim() && typed === null) {
      toast("Harga tidak dikenali. Contoh: 15000 atau 15rb", "error");
      return;
    }
    if (parsed !== item.actual_price) onPrice(parsed);
  }

  function saveQty() {
    if (qtyNum !== null && !(qtyNum > 0)) {
      toast("Jumlah harus angka lebih dari 0", "error");
      return;
    }
    if (qtyNum !== item.quantity) onQty(qtyNum);
  }

  const unitPrice = parsed ?? item.estimated_price;
  const blur = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && e.currentTarget.blur();
  return (
    <li className="py-2.5">
      <div className="flex items-center gap-2.5">
        <button onClick={onUndo} role="checkbox" aria-checked aria-label={`Keluarkan ${item.name} dari keranjang`}
          className="-m-1 grid size-11 shrink-0 place-items-center">
          <SlipCheck checked />
        </button>
        <p className="flex min-w-0 flex-1 items-end gap-1.5 font-mono">
          <span className="truncate text-[15px] font-medium">{item.name}</span>
          <span className="leader" />
          <span className="shrink-0 text-[15px] tabular-nums">
            {unitPrice != null && item.quantity != null ? plain(unitPrice * item.quantity) : "–"}
          </span>
        </p>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-2 pl-[2.6rem]">
        <label>
          <span className="sr-only">Jumlah {item.name}</span>
          <input inputMode="decimal" enterKeyHint="done"
            className={`field min-h-11 text-right font-mono tabular-nums ${item.quantity === null ? "border-danger" : ""}`}
            placeholder="jumlah" value={qtyValue} onChange={(e) => setQtyValue(e.target.value)} onBlur={saveQty} onKeyDown={blur} />
          <span className={`mt-0.5 block text-right font-mono text-[11px] ${item.quantity === null ? "font-semibold text-danger" : "text-muted"}`}>
            {item.quantity === null ? `isi jumlah (${item.unit})` : item.unit}
          </span>
        </label>
        <label>
          <span className="sr-only">Harga asli per {per.label} untuk {item.name}</span>
          <input inputMode="numeric" enterKeyHint="done" className="field min-h-11 text-right font-mono tabular-nums"
            placeholder={item.estimated_price != null ? plain(toDisplayPrice(item.estimated_price, item.unit)!) : "harga"}
            value={value} onChange={(e) => setValue(e.target.value)} onBlur={savePrice} onKeyDown={blur} />
          <span className="mt-0.5 block text-right font-mono text-[11px] text-muted">Rp per {per.label}</span>
        </label>
      </div>
    </li>
  );
}

function FinishForm({
  items: liveItems,
  missingCount,
  onDone,
}: {
  items: ShoppingItem[];
  missingCount: number;
  onDone: (sessionId: string) => void;
}) {
  const app = useApp();
  const toast = useToast();
  // Snapshot so the summary doesn't flip to "0 barang" once the cart is cleared.
  const [items] = useState(liveItems);
  const [saved, setSaved] = useState(false);
  const [store, setStore] = useState("");
  const [payment, setPayment] = useState("Tunai");
  const [notes, setNotes] = useState("");
  const est = estimatedTotal(items);
  const act = actualTotal(items);
  const noPrice = items.filter((i) => i.actual_price == null).length;
  const noQty = items.filter((i) => i.quantity === null).map((i) => i.name);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saved) return;
    try {
      const sid = app.finish({ store, payment, notes });
      setSaved(true);
      toast("Belanja tersimpan di Riwayat");
      onDone(sid);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="border-[1.5px] border-dashed border-ink/50 p-4 font-mono text-[14px]">
        <Line label={`${items.length} barang`} value={plain(act)} strong />
        {est > 0 && <Line label="Perkiraan awal" value={plain(est)} />}
        {est > 0 && act !== est && (
          <Line label={act > est ? "Lebih mahal" : "Lebih hemat"} value={plain(Math.abs(act - est))}
            tone={act > est ? "text-danger" : "text-accent"} />
        )}
        {noPrice > 0 && <p className="mt-2 font-sans text-[13px] text-muted">{noPrice} barang belum diisi harga asli, dihitung pakai harga perkiraan.</p>}
        {missingCount > 0 && <p className="mt-1 font-sans text-[13px] text-muted">{missingCount} barang tidak ada di toko akan kembali ke daftar.</p>}
      </div>
      {noQty.length > 0 && (
        <p role="alert" className="bg-danger-soft px-3 py-2 text-sm text-danger">
          Isi jumlah dulu di keranjang untuk: <b>{noQty.join(", ")}</b>. Tutup lembar ini, isi kolom jumlah, lalu tekan Selesai lagi.
        </p>
      )}
      <div>
        <label className="label" htmlFor="store">Toko / pasar</label>
        <input id="store" placeholder="mis. Pasar Minggu, Indomaret" className="field" value={store} onChange={(e) => setStore(e.target.value)} />
      </div>
      <fieldset>
        <legend className="label">Bayar pakai</legend>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_METHODS.map((m) => (
            <button type="button" key={m} onClick={() => setPayment(m)} aria-pressed={payment === m}
              className={`min-h-11 border-[1.5px] px-3 font-mono text-[14px] ${
                payment === m ? "border-ink bg-ink text-white" : "border-ink/35 bg-paper hover:border-ink"
              }`}>
              {m}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="notes">Catatan</label>
        <textarea id="notes" rows={2} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button className="btn btn-primary w-full" disabled={saved || noQty.length > 0}>
        {saved ? "Tersimpan, membuka riwayat…" : "Simpan ke riwayat"}
      </button>
    </form>
  );
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex items-end gap-2 ${strong ? "text-[17px] font-semibold" : "mt-1"} ${tone ?? ""}`}>
      <span>{label}</span>
      <span className="leader" />
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

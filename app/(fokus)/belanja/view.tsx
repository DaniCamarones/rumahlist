"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHousehold } from "@/components/household-provider";
import { ItemIcon } from "@/components/item-icon";
import { PriorityBadge, SlipCheck } from "@/components/item-row";
import { Sheet } from "@/components/sheet";
import { ListSkeleton } from "@/components/skeleton";
import { useToast } from "@/components/toast";
import { useShoppingItems } from "@/hooks/use-shopping-items";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatQty, formatRupiah, parseRupiah } from "@/lib/format";
import { changeStatus, setActualPrice } from "@/lib/item-actions";
import { errorText, supabase } from "@/lib/supabase/client";
import { actualTotal, estimatedTotal } from "@/lib/totals";
import { priceUnit, toDisplayPrice, toStoredPrice } from "@/lib/units";
import type { ShoppingItem } from "@/lib/types";

const plain = (n: number) => formatRupiah(n).replace("Rp", "");

export default function ShoppingModePage() {
  const { household, userId, canEdit, memberName } = useHousehold();
  const { items, loading, error, patchLocal, refetch } = useShoppingItems(household.id);
  const toast = useToast();
  const router = useRouter();
  const [onlyMine, setOnlyMine] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const pending = items.filter((i) => i.status === "pending" && (!onlyMine || i.assigned_to === userId));
  const inCart = items.filter((i) => i.status === "purchased" && i.checked_by === userId);
  const missing = items.filter((i) => i.status === "unavailable" && i.checked_by === userId);
  const byOthers = items.filter((i) => i.status === "purchased" && i.checked_by !== userId);
  const mineCount = items.filter((i) => i.status === "pending" && i.assigned_to === userId).length;

  const groups = useMemo(
    () => CATEGORIES.map((c) => ({ ...c, items: pending.filter((i) => i.category === c.id) })).filter((g) => g.items.length),
    [pending],
  );

  const cartTotal = actualTotal(inCart);
  const remainingEstimate = estimatedTotal(pending);
  const totalCount = pending.length + inCart.length;
  const progress = totalCount ? inCart.length / totalCount : 0;

  async function move(item: ShoppingItem, to: ShoppingItem["status"]) {
    patchLocal(item.id, { status: to, checked_by: to === "pending" ? null : userId });
    const res = await changeStatus(item, item.status, to, userId);
    if (!res.ok) {
      toast(res.reason === "conflict" ? `${item.name} sudah dicentang anggota lain` : errorText(res), "error");
      refetch();
    }
  }

  if (!canEdit) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="paper max-w-sm p-6">
          <p className="font-mono font-semibold">Mode Belanja hanya untuk anggota yang bisa mengubah daftar.</p>
          <p className="mt-1 text-sm text-muted">Minta Pemilik keluarga mengubah peranmu di menu Keluarga.</p>
          <Link href="/" className="btn btn-ghost mt-4">Kembali ke beranda</Link>
        </div>
      </div>
    );
  }

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
        {mineCount > 0 && (
          <div className="mt-3 grid grid-cols-2 border-[1.5px] border-ink" role="group" aria-label="Tampilkan">
            {[false, true].map((v) => (
              <button key={String(v)} onClick={() => setOnlyMine(v)} aria-pressed={onlyMine === v}
                className={`min-h-11 font-mono text-[14px] ${onlyMine === v ? "bg-ink text-white" : "bg-paper"}`}>
                {v ? `Tugas saya (${mineCount})` : "Semua barang"}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="paper mt-6 p-5">
            <p className="font-mono font-semibold">Daftar gagal dimuat.</p>
            <button className="btn btn-ghost mt-3" onClick={refetch}>Coba lagi</button>
          </div>
        ) : pending.length === 0 && inCart.length === 0 ? (
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
                              <span>{formatQty(i.quantity)} {i.unit}</span>
                              {i.estimated_price != null && <span>±{formatRupiah(i.estimated_price * i.quantity)}</span>}
                              <PriorityBadge priority={i.priority} />
                              {i.assigned_to && i.assigned_to !== userId && <span>untuk {memberName(i.assigned_to)}</span>}
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
                <CartRow key={i.id} item={i} onUndo={() => move(i, "pending")}
                  onPrice={(p) => patchLocal(i.id, { actual_price: p })} />
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
                  <button onClick={() => move(i, "pending")}
                    className="min-h-11 px-1 text-[14px] text-accent underline underline-offset-4">
                    Ternyata ada
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {byOthers.length > 0 && (
          <p className="mt-5 px-1 font-mono text-[13px] text-muted">
            Sudah dibeli anggota lain: {byOthers.map((i) => i.name).join(", ")}.
          </p>
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
        <FinishForm items={inCart} missingCount={missing.length}
          onDone={(sid) => router.push(`/riwayat/${sid}`)} householdId={household.id} />
      </Sheet>
    </div>
  );
}

function CartRow({ item, onUndo, onPrice }: { item: ShoppingItem; onUndo: () => void; onPrice: (p: number | null) => void }) {
  const toast = useToast();
  const per = priceUnit(item.unit);
  const [value, setValue] = useState(item.actual_price != null ? String(toDisplayPrice(item.actual_price, item.unit)) : "");
  const typed = value.trim() ? parseRupiah(value) : null;
  const parsed = typed === null ? null : toStoredPrice(typed, item.unit);

  async function save() {
    if (value.trim() && typed === null) {
      toast("Harga tidak dikenali. Contoh: 15000 atau 15rb", "error");
      return;
    }
    if (parsed === item.actual_price) return;
    onPrice(parsed);
    const { error } = await setActualPrice(item.id, parsed);
    if (error) toast(errorText(error), "error");
  }

  const unitPrice = parsed ?? item.estimated_price;
  return (
    <li className="flex items-center gap-2.5 py-2.5">
      <button onClick={onUndo} role="checkbox" aria-checked aria-label={`Keluarkan ${item.name} dari keranjang`}
        className="-m-1 grid size-11 shrink-0 place-items-center">
        <SlipCheck checked />
      </button>
      <div className="min-w-0 flex-1 font-mono">
        <p className="truncate text-[15px] font-medium">{item.name}</p>
        <p className="text-[12.5px] text-muted">
          {formatQty(item.quantity)} {item.unit}
          {unitPrice != null && <> = {formatRupiah(unitPrice * item.quantity)}</>}
        </p>
      </div>
      <label className="w-[8.5rem] shrink-0">
        <span className="sr-only">Harga asli per {per.label} untuk {item.name}</span>
        <input inputMode="numeric" enterKeyHint="done" className="field min-h-11 text-right font-mono tabular-nums"
          placeholder={item.estimated_price != null ? plain(toDisplayPrice(item.estimated_price, item.unit)!) : "harga"}
          value={value} onChange={(e) => setValue(e.target.value)} onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
        <span className="mt-0.5 block text-right font-mono text-[11px] text-muted">Rp per {per.label}</span>
      </label>
    </li>
  );
}

function FinishForm({
  items: liveItems,
  missingCount,
  householdId,
  onDone,
}: {
  items: ShoppingItem[];
  missingCount: number;
  householdId: string;
  onDone: (sessionId: string) => void;
}) {
  const toast = useToast();
  // Snapshot so the summary doesn't flip to "0 barang" when realtime clears the cart after saving.
  const [items] = useState(liveItems);
  const [saved, setSaved] = useState(false);
  const [store, setStore] = useState("");
  const [payment, setPayment] = useState("Tunai");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const est = estimatedTotal(items);
  const act = actualTotal(items);
  const noPrice = items.filter((i) => i.actual_price == null).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase().rpc("finish_shopping_session", {
      p_household: householdId, p_store: store, p_payment: payment, p_notes: notes,
    });
    if (error) {
      setBusy(false);
      return toast(errorText(error), "error");
    }
    setSaved(true);
    toast("Belanja tersimpan di Riwayat");
    onDone(data as string);
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
      <button className="btn btn-primary w-full" disabled={busy}>
        {saved ? "Tersimpan, membuka riwayat…" : busy ? "Menyimpan…" : "Simpan ke riwayat"}
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

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { ItemIcon } from "@/components/item-icon";
import { useToast } from "@/components/toast";
import { CATEGORIES } from "@/lib/constants";
import { formatDate, formatQty, formatRupiah } from "@/lib/format";
import { priceUnit, toDisplayPrice } from "@/lib/units";

const plain = (n: number) => formatRupiah(n).replace("Rp", "");

export default function ReceiptPage() {
  return (
    <Suspense fallback={<p className="font-mono text-muted">Membuka nota…</p>}>
      <Receipt />
    </Suspense>
  );
}

/** One finished shopping trip, printed as the receipt it represents. Uses ?id= so it works as a static page. */
function Receipt() {
  const id = useSearchParams().get("id");
  const app = useApp();
  const { state } = app;
  const toast = useToast();
  const session = state.sessions.find((s) => s.id === id);
  const waiting = new Set(state.items.filter((i) => i.status === "pending").map((i) => i.name.toLowerCase()));

  function again(lineIds?: string[]) {
    const n = app.buyAgain(session!.id, lineIds);
    toast(n ? `${n} barang masuk daftar belanja` : "Semua barang ini sudah ada di daftar");
  }

  const back = (
    <Link href="/riwayat" className="-ml-1 inline-flex min-h-11 items-center px-1 font-mono text-[14px] underline underline-offset-4">
      ← Riwayat
    </Link>
  );

  if (!session)
    return (
      <>
        {back}
        <div className="paper mt-4 p-5">
          <p className="font-mono font-semibold">Nota ini tidak ditemukan di HP ini.</p>
          <p className="mt-1 text-sm text-muted">Mungkin sudah dihapus, atau dibuat di perangkat lain.</p>
        </div>
      </>
    );

  const items = state.sessionItems
    .filter((i) => i.session_id === session.id)
    .sort((a, b) => CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category));
  const diff = session.total_actual - session.total_estimated;

  return (
    <div className="max-w-md">
      {back}
      <article className="paper torn mt-2 px-5 pt-5 pb-9 font-mono">
        <header className="text-center">
          <p className="text-[17px] font-semibold">{(session.store_name ?? "Belanja").toUpperCase()}</p>
          {state.profile.name && <p className="text-[13px] text-muted">{state.profile.name}</p>}
          <p className="text-[13px] text-muted">{formatDate(session.shopped_at, true)}</p>
        </header>
        <div className="rule mt-3 pt-2">
          {items.map((i) => {
            const unit = i.actual_price ?? i.estimated_price;
            const per = priceUnit(i.unit);
            return (
              <div key={i.id} className="flex items-start gap-2 py-1.5">
                <ItemIcon name={i.name} category={i.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-end gap-1.5">
                    <span className="text-[15px]">{i.name}</span>
                    <span className="leader" />
                    <span className="text-[15px] tabular-nums">{unit != null ? plain(unit * i.quantity) : "–"}</span>
                  </div>
                  <p className="text-[12.5px] text-muted">
                    {formatQty(i.quantity)} {i.unit}
                    {unit != null && <> × {plain(toDisplayPrice(unit, i.unit)!)}/{per.label}</>}
                    {i.actual_price != null && i.estimated_price != null && i.actual_price !== i.estimated_price && (
                      <> (perkiraan {plain(toDisplayPrice(i.estimated_price, i.unit)!)})</>
                    )}
                  </p>
                  {waiting.has(i.name.toLowerCase()) ? (
                    <p className="text-[12px] text-muted">sudah di daftar</p>
                  ) : (
                    <button onClick={() => again([i.id])} className="-my-1 min-h-9 text-[13px] text-accent underline underline-offset-4">
                      + Beli lagi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rule mt-2 pt-3">
          <div className="flex items-end gap-2 text-[19px] font-semibold">
            <span>TOTAL</span>
            <span className="leader" />
            <span className="tabular-nums">{formatRupiah(session.total_actual)}</span>
          </div>
          {session.total_estimated > 0 && (
            <>
              <div className="mt-1 flex items-end gap-2 text-[14px] text-muted">
                <span>Perkiraan</span>
                <span className="leader" />
                <span className="tabular-nums">{plain(session.total_estimated)}</span>
              </div>
              <div className={`mt-1 flex items-end gap-2 text-[14px] font-semibold ${diff > 0 ? "text-danger" : "text-accent"}`}>
                <span>{diff === 0 ? "Pas sesuai perkiraan" : diff > 0 ? "Lebih mahal" : "Lebih hemat"}</span>
                <span className="leader" />
                <span className="tabular-nums">{diff === 0 ? "0" : plain(Math.abs(diff))}</span>
              </div>
            </>
          )}
        </div>
        <div className="rule mt-3 pt-2 text-[13px] text-muted">
          {session.payment_method && <p>Bayar: {session.payment_method}</p>}
          <p>{session.item_count} barang</p>
          {session.notes && <p className="mt-1 font-sans text-ink">“{session.notes}”</p>}
        </div>
      </article>
      <button className="btn btn-primary mt-4 w-full" onClick={() => again()}>Beli lagi semua</button>
      <p className="mt-2 text-center text-[13px] text-muted">
        Barang di nota ini masuk lagi ke daftar, dengan harga terakhir sebagai perkiraan.
      </p>
    </div>
  );
}

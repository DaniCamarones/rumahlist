"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useHousehold } from "@/components/household-provider";
import { ListSkeleton } from "@/components/skeleton";
import { ItemIcon } from "@/components/item-icon";
import { CATEGORIES } from "@/lib/constants";
import { formatDate, formatQty, formatRupiah } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { priceUnit, toDisplayPrice } from "@/lib/units";
import type { SessionItem, ShoppingSession } from "@/lib/types";

const plain = (n: number) => formatRupiah(n).replace("Rp", "");

/** One finished shopping trip, printed as the receipt it represents. */
export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { household, memberName } = useHousehold();
  const [session, setSession] = useState<ShoppingSession | null | undefined>();
  const [items, setItems] = useState<SessionItem[]>([]);

  useEffect(() => {
    const db = supabase();
    Promise.all([
      db.from("shopping_sessions").select("*").eq("id", id).maybeSingle(),
      db.from("shopping_session_items").select("*").eq("session_id", id),
    ]).then(([s, i]) => {
      setSession((s.data as ShoppingSession) ?? null);
      setItems(((i.data ?? []) as SessionItem[]).map((x) => ({
        ...x,
        quantity: Number(x.quantity),
        estimated_price: x.estimated_price == null ? null : Number(x.estimated_price),
        actual_price: x.actual_price == null ? null : Number(x.actual_price),
      })));
    });
  }, [id]);

  const back = (
    <Link href="/riwayat" className="-ml-1 inline-flex min-h-11 items-center px-1 font-mono text-[14px] underline underline-offset-4">
      ← Riwayat
    </Link>
  );

  if (session === undefined) return <>{back}<ListSkeleton label="Memuat nota" /></>;
  if (session === null)
    return (
      <>
        {back}
        <div className="paper mt-4 p-5">
          <p className="font-mono font-semibold">Nota ini tidak ditemukan.</p>
          <p className="mt-1 text-sm text-muted">Mungkin milik keluarga lain, atau tautannya salah.</p>
        </div>
      </>
    );

  const diff = session.total_actual - session.total_estimated;
  const sorted = [...items].sort(
    (a, b) => CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category),
  );

  return (
    <div className="max-w-md">
      {back}
      <article className="paper torn mt-2 px-5 pt-5 pb-9 font-mono">
        <header className="text-center">
          <p className="text-[17px] font-semibold">{(session.store_name ?? "Belanja").toUpperCase()}</p>
          <p className="text-[13px] text-muted">{household.name}</p>
          <p className="text-[13px] text-muted">{formatDate(session.shopped_at, true)}</p>
        </header>
        <div className="rule mt-3 pt-2">
          {sorted.map((i) => {
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
          <p>Dibeli oleh: {memberName(session.shopper_id)}</p>
          {session.payment_method && <p>Bayar: {session.payment_method}</p>}
          <p>{session.item_count} barang</p>
          {session.notes && <p className="mt-1 font-sans text-ink">“{session.notes}”</p>}
        </div>
      </article>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHousehold } from "@/components/household-provider";
import { ListSkeleton } from "@/components/skeleton";
import { formatDate, formatRupiah } from "@/lib/format";
import { errorText, supabase } from "@/lib/supabase/client";
import type { ShoppingSession } from "@/lib/types";

export default function HistoryPage() {
  const { household, memberName } = useHousehold();
  const [sessions, setSessions] = useState<ShoppingSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase()
      .from("shopping_sessions")
      .select("*")
      .eq("household_id", household.id)
      .order("shopped_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) setError(errorText(error));
        else setSessions((data ?? []) as ShoppingSession[]);
      });
  }, [household.id]);

  const now = new Date();
  const thisMonth = (sessions ?? []).filter((s) => {
    const d = new Date(s.shopped_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((a, s) => a + s.total_actual, 0);
  const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(now);

  return (
    <div>
      <p className="slip-heading">Kumpulan nota · {household.name}</p>
      <h1 className="mt-1 font-mono text-[26px] leading-tight font-semibold md:text-[30px]">Riwayat Belanja</h1>
      {sessions && sessions.length > 0 && (
        <p className="mt-1 font-mono text-[14px] text-muted">
          {monthName}: {thisMonth.length} kali belanja · {formatRupiah(monthTotal)}
        </p>
      )}

      {error ? (
        <div className="paper mt-6 p-5">
          <p className="font-mono font-semibold">Riwayat gagal dimuat.</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <button className="btn btn-ghost mt-4" onClick={() => location.reload()}>Muat ulang</button>
        </div>
      ) : sessions === null ? (
        <ListSkeleton label="Memuat riwayat" />
      ) : sessions.length === 0 ? (
        <div className="paper torn mt-6 px-5 pt-6 pb-8">
          <p className="font-mono text-[17px] font-semibold">Belum ada nota</p>
          <p className="mt-1 text-muted">Setelah belanja di Mode Belanja dan menekan Selesai, notanya tersimpan di sini.</p>
          <Link href="/belanja" className="btn btn-primary mt-4">Mulai belanja</Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/riwayat/${s.id}`} className="paper block px-4 py-3 font-mono hover:outline hover:outline-[1.5px] hover:outline-ink">
                <div className="flex items-end gap-2">
                  <span className="min-w-0 truncate text-[16px] font-semibold">{s.store_name ?? "Belanja"}</span>
                  <span className="leader" />
                  <span className="text-[16px] font-semibold tabular-nums">{formatRupiah(s.total_actual)}</span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">
                  {formatDate(s.shopped_at)} · {memberName(s.shopper_id)} · {s.item_count} barang
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { formatDate, formatRupiah } from "@/lib/format";

export default function HistoryPage() {
  const { state } = useApp();
  const sessions = state.sessions;

  const now = new Date();
  const thisMonth = sessions.filter((s) => {
    const d = new Date(s.shopped_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((a, s) => a + s.total_actual, 0);
  const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(now);

  return (
    <div>
      <p className="slip-heading">Kumpulan nota</p>
      <h1 className="mt-1 font-mono text-[26px] leading-tight font-semibold md:text-[30px]">Riwayat Belanja</h1>
      {sessions.length > 0 && (
        <p className="mt-1 font-mono text-[14px] text-muted">
          {monthName}: {thisMonth.length} kali belanja · {formatRupiah(monthTotal)}
        </p>
      )}

      {sessions.length === 0 ? (
        <div className="paper torn mt-6 px-5 pt-6 pb-8">
          <p className="font-mono text-[17px] font-semibold">Belum ada nota</p>
          <p className="mt-1 text-muted">Setelah belanja di Mode Belanja dan menekan Selesai, notanya tersimpan di sini.</p>
          <Link href="/belanja" className="btn btn-primary mt-4">Mulai belanja</Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/riwayat/nota?id=${s.id}`} className="paper block px-4 py-3 font-mono hover:outline hover:outline-[1.5px] hover:outline-ink">
                <div className="flex items-end gap-2">
                  <span className="min-w-0 truncate text-[16px] font-semibold">{s.store_name ?? "Belanja"}</span>
                  <span className="leader" />
                  <span className="text-[16px] font-semibold tabular-nums">{formatRupiah(s.total_actual)}</span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">
                  {formatDate(s.shopped_at)} · {s.item_count} barang{s.payment_method && ` · ${s.payment_method}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

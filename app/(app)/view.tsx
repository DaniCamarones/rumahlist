"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { ItemIcon } from "@/components/item-icon";
import { formatDate, formatQty, formatRupiah } from "@/lib/format";
import { estimatedTotal } from "@/lib/totals";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}
const noop = () => () => {};

/**
 * Home answers one question: what do I still need to buy, and is any of it urgent?
 * The summary is a short receipt, not a row of stat cards.
 */
export default function HomePage() {
  const { state } = useApp();
  const hello = useSyncExternalStore(noop, greeting, () => "Halo");

  const pending = state.items.filter((i) => i.status === "pending");
  const checked = state.items.filter((i) => i.status === "purchased");
  const urgent = pending.filter((i) => i.priority === "urgent");
  const total = estimatedTotal(state.items);
  const last = state.sessions[0];

  return (
    <div>
      <p className="slip-heading">RumahList</p>
      <h1 className="mt-1 font-mono text-[24px] leading-tight font-semibold md:text-[28px]">
        {hello}{state.profile.name ? `, ${state.profile.name}` : ""}.
      </h1>

      <section className="paper torn mt-5 px-4 pt-3 pb-7 font-mono" aria-label="Ringkasan belanja">
        <h2 className="slip-heading">Ringkasan</h2>
        <div className="mt-1 text-[15px]">
          <SumLine label="Belum dibeli" value={`${pending.length} barang`} />
          <SumLine label="Sudah dicentang" value={`${checked.length} barang`} />
          <SumLine label="Perlu segera" value={`${urgent.length} barang`} tone={urgent.length ? "text-danger font-semibold" : ""} />
          <div className="rule mt-2 pt-2">
            <SumLine label="PERKIRAAN" value={formatRupiah(total)} strong />
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/belanja" className="btn btn-primary min-h-14">Mulai belanja</Link>
        <Link href="/daftar" className="btn btn-ghost min-h-14 uppercase">Tambah barang</Link>
      </div>

      {urgent.length > 0 && (
        <section className="mt-7">
          <h2 className="slip-heading">Perlu segera dibeli</h2>
          <ul className="paper mt-2 px-4 py-1">
            {urgent.map((i) => (
              <li key={i.id} className="flex items-center gap-2.5 py-2 font-mono">
                <ItemIcon name={i.name} category={i.category} size="sm" />
                <span className="flex-1 text-[15px] font-medium">{i.name}</span>
                <span className="text-[13px] text-muted">{formatQty(i.quantity)} {i.unit}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="slip-heading">Nota terakhir</h2>
          {last && <Link href="/riwayat" className="font-mono text-[13px] text-accent underline underline-offset-4">Semua nota</Link>}
        </div>
        {last ? (
          <Link href={`/riwayat/nota?id=${last.id}`} className="paper mt-2 block px-4 py-3 font-mono hover:outline hover:outline-[1.5px] hover:outline-ink">
            <div className="flex items-end gap-2">
              <span className="min-w-0 truncate text-[16px] font-semibold">{last.store_name ?? "Belanja"}</span>
              <span className="leader" />
              <span className="text-[16px] font-semibold tabular-nums">{formatRupiah(last.total_actual)}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-muted">{formatDate(last.shopped_at)} · {last.item_count} barang</p>
          </Link>
        ) : (
          <p className="paper mt-2 px-4 py-4 text-[14px] text-muted">
            Belum ada nota. Setelah selesai belanja di Mode Belanja, notanya muncul di sini.
          </p>
        )}
      </section>
    </div>
  );
}

function SumLine({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex items-end gap-2 py-1 ${strong ? "text-[19px] font-semibold" : ""} ${tone ?? ""}`}>
      <span>{label}</span>
      <span className="leader" />
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { formatQty, formatRupiah } from "@/lib/format";
import type { ShoppingItem } from "@/lib/types";
import { ItemIcon } from "./item-icon";

/** Printed tag on a receipt line. Only "segera" uses red, because it changes what gets bought first. */
export function PriorityBadge({ priority }: { priority: ShoppingItem["priority"] }) {
  if (priority === "normal") return null;
  return priority === "urgent" ? (
    <span className="font-mono text-[12px] font-semibold text-danger">SEGERA</span>
  ) : (
    <span className="font-mono text-[12px] text-muted">opsional</span>
  );
}

const STATUS_TAG: Partial<Record<ShoppingItem["status"], string>> = {
  unavailable: "TIDAK ADA",
  cancelled: "BATAL",
};

/** Square checkbox printed on the slip. Check glyph is the one functional icon kept. */
export function SlipCheck({ checked, size = "md" }: { checked: boolean; size?: "md" | "lg" }) {
  return (
    <span className={`grid shrink-0 place-items-center border-2 border-ink ${size === "lg" ? "size-9" : "size-6"} ${
      checked ? "bg-ink text-white" : "bg-paper"
    }`}>
      {checked && <Check size={size === "lg" ? 22 : 16} strokeWidth={3} aria-hidden />}
    </span>
  );
}

export function ItemRow({ item, onToggle, onMenu }: { item: ShoppingItem; onToggle: () => void; onMenu: () => void }) {
  const done = item.status !== "pending";
  const checked = item.status === "purchased";
  const price = item.actual_price ?? item.estimated_price;

  return (
    <li className="flex items-start gap-2.5 py-2.5">
      <button
        onClick={onToggle}
        disabled={item.status === "unavailable" || item.status === "cancelled"}
        role="checkbox"
        aria-checked={checked}
        aria-label={checked ? `Batalkan centang ${item.name}` : `Centang ${item.name}`}
        className="-m-2.5 grid size-11 shrink-0 place-items-center disabled:opacity-60"
      >
        <SlipCheck checked={checked} />
      </button>

      <span className={done ? "opacity-45" : ""}><ItemIcon name={item.name} category={item.category} size="sm" /></span>

      <div className="min-w-0 flex-1 font-mono">
        <div className="flex items-end gap-1.5">
          <span className={`min-w-0 text-[15px] leading-snug font-medium ${done ? "text-muted line-through" : ""}`}>{item.name}</span>
          <span className="leader" />
          <span className={`shrink-0 text-[15px] tabular-nums ${done ? "text-muted" : ""}`}>
            {price != null ? formatRupiah(price * item.quantity).replace("Rp", "") : "–"}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-[12.5px] text-muted">
          <span>{formatQty(item.quantity)} {item.unit}</span>
          <PriorityBadge priority={item.priority} />
          {STATUS_TAG[item.status] && <span className="font-semibold text-warn-ink">{STATUS_TAG[item.status]}</span>}
        </p>
        {item.notes && <p className="mt-0.5 font-sans text-[13px] text-muted">“{item.notes}”</p>}
      </div>

      <button onClick={onMenu} aria-label={`Pilihan untuk ${item.name}`}
        className="-my-2 -mr-2 grid size-11 shrink-0 place-items-center font-mono text-[18px] text-muted hover:bg-counter">
        <span aria-hidden>⋯</span>
      </button>
    </li>
  );
}

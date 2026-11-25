"use client";

import { useEffect } from "react";

/** Bottom sheet on phones, centered dialog on larger screens: a fresh slip of paper. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Tutup" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="pb-safe relative max-h-[92dvh] w-full overflow-y-auto bg-paper md:max-w-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-dashed border-ink/40 bg-paper px-5 pt-3 pb-2.5">
          <h2 className="font-mono text-[16px] font-semibold uppercase">{title}</h2>
          <button onClick={onClose} aria-label="Tutup"
            className="-mr-2 grid size-11 place-items-center font-mono text-[26px] leading-none hover:bg-counter">
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="px-5 pt-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHousehold } from "./household-provider";

// Navigation is a row of printed register keys: text labels, no icon set.
const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/daftar", label: "Daftar" },
  { href: "/belanja", label: "Belanja" },
  { href: "/riwayat", label: "Riwayat" },
  { href: "/keluarga", label: "Keluarga" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Wordmark({ sub }: { sub?: string }) {
  return (
    <div>
      <p className="font-mono text-[17px] font-semibold tracking-tight">RUMAHLIST</p>
      {sub && <p className="truncate font-mono text-[13px] text-muted">{sub}</p>}
    </div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const { household, me } = useHousehold();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col px-5 py-7 md:flex">
      <Wordmark sub={household.name} />
      <nav className="mt-8 flex flex-col gap-1.5" aria-label="Utama">
        {LINKS.map(({ href, label }) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center px-3 font-mono text-[15px] uppercase ${
                active
                  ? href === "/belanja" ? "bg-accent text-white" : "bg-ink text-white"
                  : "text-ink hover:bg-paper"
              }`}>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-3 border-t border-dashed border-ink/40 pt-4">
        <Avatar name={me.display_name} />
        <p className="truncate text-sm font-semibold">{me.display_name}</p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Utama" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-ink bg-paper md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {LINKS.map(({ href, label }) => {
          const active = isActive(path, href);
          const primary = href === "/belanja";
          return (
            <li key={href} className="border-r border-line last:border-r-0">
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center px-0.5 font-mono text-[12px] font-medium uppercase ${
                  primary ? "bg-accent text-white" : active ? "bg-ink text-white" : "text-ink"
                } ${primary && active ? "underline decoration-2 underline-offset-4" : ""}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Initial in a small printed box; no generated photos. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span aria-hidden
      className={`grid shrink-0 place-items-center border-[1.5px] border-ink bg-paper font-mono font-semibold ${
        size === "sm" ? "size-6 text-[11px]" : "size-9 text-sm"
      }`}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

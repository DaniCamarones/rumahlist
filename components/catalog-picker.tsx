"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { CATALOG, searchCatalog, type CatalogItem } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";
import { ItemIcon } from "./item-icon";

/** Grid of catalog items by category; one tap adds an item to the list. */
export function CatalogPicker({
  inList,
  onAdd,
  initialCategory,
}: {
  inList: Set<string>;
  onAdd: (item: CatalogItem) => Promise<boolean>;
  initialCategory?: string | null;
}) {
  const [category, setCategory] = useState(initialCategory ?? "vegetable");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const items = useMemo(
    () => (query.trim() ? searchCatalog(query, 60) : CATALOG.filter((i) => i.category === category)),
    [query, category],
  );
  const cats = CATEGORIES.filter((c) => c.id !== "other");

  async function tap(item: CatalogItem) {
    const key = item.name.toLowerCase();
    if (inList.has(key) || added.has(key) || pending) return;
    setPending(key);
    const ok = await onAdd(item);
    setPending(null);
    if (ok) setAdded((s) => new Set(s).add(key));
  }

  return (
    <div>
      <input type="search" aria-label="Cari di katalog" placeholder="Cari, mis. bawang" className="field"
        value={query} onChange={(e) => setQuery(e.target.value)} />

      {!query.trim() && (
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Kategori katalog">
          {cats.map((c) => (
            <button key={c.id} role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}
              className={`min-h-10 shrink-0 border-[1.5px] px-3 font-mono text-[13px] whitespace-nowrap ${
                category === c.id ? "border-ink bg-ink text-white" : "border-ink/35 bg-paper hover:border-ink"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">
          Tidak ada di katalog. Tutup ini dan ketik namanya di kolom Tambah untuk menambah manual.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => {
            const key = item.name.toLowerCase();
            const done = inList.has(key) || added.has(key);
            return (
              <li key={item.name}>
                <button onClick={() => tap(item)} aria-pressed={done} disabled={pending === key}
                  aria-label={done ? `${item.name}, sudah di daftar` : `Tambah ${item.name}`}
                  className={`relative flex h-full min-h-24 w-full flex-col items-center gap-1.5 border-[1.5px] px-1.5 py-2.5 text-center font-mono text-[13px] leading-tight ${
                    done ? "border-accent bg-accent-soft" : "border-ink/20 bg-paper hover:border-ink"
                  }`}>
                  <ItemIcon name={item.name} category={item.category} size="lg" />
                  {item.name}
                  {done && (
                    <span className="absolute top-0 right-0 grid size-6 place-items-center bg-accent text-white">
                      <Check size={14} strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

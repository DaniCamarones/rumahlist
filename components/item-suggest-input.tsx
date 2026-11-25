"use client";

import { useId, useMemo, useState } from "react";
import { categoryOf } from "@/lib/constants";
import { searchCatalog, type CatalogItem } from "@/lib/catalog";
import { ItemIcon } from "./item-icon";

/**
 * Text field that suggests catalog items while typing. Picking a suggestion
 * hands back the whole item (category, unit, quantity); Enter with nothing
 * highlighted submits the typed text as a manual item.
 */
export function ItemSuggestInput({
  value,
  onChange,
  onPick,
  onSubmitText,
  inList,
  placeholder,
  id,
  autoFocus,
  className = "field",
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (item: CatalogItem) => void;
  onSubmitText?: (text: string) => void;
  inList?: Set<string>;
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const results = useMemo(() => searchCatalog(value, 8), [value]);
  const typed = value.trim();
  const exact = results.some((r) => r.name.toLowerCase() === typed.toLowerCase());
  const showManual = Boolean(onSubmitText && typed && !exact);
  const count = results.length + (showManual ? 1 : 0);
  const visible = open && typed.length > 0 && count > 0;

  function choose(index: number) {
    if (index < results.length) onPick(results[index]);
    else if (onSubmitText && typed) onSubmitText(typed);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && count) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % count);
    } else if (e.key === "ArrowUp" && count) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? count - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      if (visible && active >= 0) {
        e.preventDefault();
        choose(active);
      } else if (onSubmitText && typed) {
        e.preventDefault();
        choose(results.length);
      }
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {visible && (
        <ul id={listId} role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-80 min-w-64 overflow-y-auto border-[1.5px] border-ink bg-paper py-1 shadow-lg">
          {results.map((item, i) => {
            const already = inList?.has(item.name.toLowerCase());
            return (
              <li key={item.name} id={`${listId}-${i}`} role="option" aria-selected={active === i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 px-3 py-1.5 ${active === i ? "bg-accent-soft" : "hover:bg-counter"}`}>
                <ItemIcon name={item.name} category={item.category} />
                <span className="min-w-0 flex-1">
                  <Highlight text={item.name} query={typed} />
                  <span className="block font-mono text-[12px] text-muted">
                    {categoryOf(item.category).label} · {item.quantity} {item.unit}
                  </span>
                </span>
                {already && <span className="font-mono text-[11px] font-semibold text-accent">SUDAH ADA</span>}
              </li>
            );
          })}
          {showManual && (
            <li id={`${listId}-${results.length}`} role="option" aria-selected={active === results.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(results.length)}
              className={`flex min-h-12 cursor-pointer items-center gap-2.5 border-t border-dashed border-ink/40 px-3 py-1.5 ${
                active === results.length ? "bg-accent-soft" : "hover:bg-counter"
              }`}>
              <span aria-hidden className="grid size-9 place-items-center font-mono text-xl text-muted">+</span>
              <span className="text-sm">Tambah <b>“{typed}”</b> sebagai barang baru</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0 || !query) return <span className="block font-mono text-[15px] font-medium">{text}</span>;
  return (
    <span className="block font-mono text-[15px] font-medium">
      {text.slice(0, i)}
      <mark className="bg-transparent text-ink underline decoration-accent decoration-2 underline-offset-2">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </span>
  );
}

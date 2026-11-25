"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogPicker } from "@/components/catalog-picker";
import { ItemSuggestInput } from "@/components/item-suggest-input";
import { findCatalogItem, type CatalogItem } from "@/lib/catalog";
import { useHousehold } from "@/components/household-provider";
import { ItemForm } from "@/components/item-form";
import { ItemRow } from "@/components/item-row";
import { ListSkeleton } from "@/components/skeleton";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { useShoppingItems } from "@/hooks/use-shopping-items";
import { CATEGORIES, PRIORITIES, categoryOf } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { changeStatus, deleteItem, duplicateItem } from "@/lib/item-actions";
import { errorText, supabase } from "@/lib/supabase/client";
import { estimatedTotal } from "@/lib/totals";
import type { ShoppingItem } from "@/lib/types";

const rank = (p: ShoppingItem["priority"]) => PRIORITIES.find((x) => x.id === p)!.rank;

export default function ShoppingListPage() {
  const { household, userId, canEdit } = useHousehold();
  const { items, loading, error, patchLocal, removeLocal, refetch } = useShoppingItems(household.id);
  const toast = useToast();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"priority" | "newest">("priority");
  const [grouped, setGrouped] = useState(true);
  const [quick, setQuick] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editing, setEditing] = useState<ShoppingItem | undefined>();
  const [menuItem, setMenuItem] = useState<ShoppingItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#tambah" && canEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from dashboard
      setFormOpen(true);
      history.replaceState(null, "", "/daftar");
    }
  }, [canEdit]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (!q || i.name.toLowerCase().includes(q) || i.notes?.toLowerCase().includes(q)))
      .filter((i) => !category || i.category === category)
      .sort((a, b) =>
        sort === "priority"
          ? rank(a.priority) - rank(b.priority) || a.name.localeCompare(b.name, "id")
          : b.created_at.localeCompare(a.created_at),
      );
  }, [items, query, category, sort]);

  const pending = filtered.filter((i) => i.status === "pending");
  const done = filtered.filter((i) => i.status !== "pending");
  const groups = useMemo(() => {
    if (!grouped) return [{ id: "all", label: "", items: pending }];
    return CATEGORIES.map((c) => ({ id: c.id, label: c.label, items: pending.filter((i) => i.category === c.id) })).filter(
      (g) => g.items.length,
    );
  }, [grouped, pending]);

  const usedCategories = CATEGORIES.filter((c) => items.some((i) => i.category === c.id));

  async function toggle(item: ShoppingItem) {
    const to = item.status === "purchased" ? "pending" : "purchased";
    patchLocal(item.id, { status: to, checked_by: to === "pending" ? null : userId });
    const res = await changeStatus(item, item.status, to, userId);
    if (!res.ok) {
      toast(res.reason === "conflict" ? "Barang ini sudah diubah anggota lain" : errorText(res), "error");
      refetch();
    }
  }

  const inList = useMemo(
    () => new Set(items.filter((i) => i.status === "pending").map((i) => i.name.toLowerCase())),
    [items],
  );

  /** Adds a catalog item (category, unit, quantity filled in) or a typed name. */
  async function addItem(item: CatalogItem | { name: string }): Promise<boolean> {
    const known = "category" in item ? item : findCatalogItem(item.name);
    const name = known?.name ?? item.name.trim();
    if (!name) return false;
    if (inList.has(name.toLowerCase())) {
      toast(`${name} sudah ada di daftar`);
      return true;
    }
    const { error } = await supabase().from("shopping_items").insert({
      household_id: household.id,
      added_by: userId,
      name,
      category: known?.category ?? category ?? "other",
      unit: known?.unit ?? "pcs",
      quantity: known?.quantity ?? 1,
    });
    if (error) {
      toast(errorText(error), "error");
      return false;
    }
    toast(`${name} ditambahkan`);
    return true;
  }

  async function addQuick(item: CatalogItem | { name: string }) {
    setQuick("");
    if (!(await addItem(item))) setQuick(item.name);
  }

  async function menuAction(action: "edit" | "duplicate" | "unavailable" | "cancel" | "restore" | "delete") {
    const item = menuItem!;
    if (action === "edit") {
      setMenuItem(null);
      setEditing(item);
      setFormOpen(true);
      return;
    }
    if (action === "delete" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setMenuItem(null);
    setConfirmDelete(false);
    if (action === "duplicate") {
      const { error } = await duplicateItem(item, userId);
      toast(error ? errorText(error) : `${item.name} diduplikat`, error ? "error" : "ok");
    } else if (action === "delete") {
      removeLocal(item.id);
      const { error } = await deleteItem(item.id);
      if (error) {
        toast(errorText(error), "error");
        refetch();
      } else toast(`${item.name} dihapus`);
    } else {
      const to = action === "unavailable" ? "unavailable" : action === "cancel" ? "cancelled" : "pending";
      const res = await changeStatus(item, item.status, to, userId);
      if (!res.ok) toast(res.reason === "conflict" ? "Barang ini sudah diubah anggota lain" : errorText(res), "error");
    }
  }

  const total = estimatedTotal(items);
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const openForm = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <div>
      <header>
        <p className="slip-heading">Nota belanja · {household.name}</p>
        <h1 className="mt-1 font-mono text-[26px] leading-tight font-semibold md:text-[30px]">Daftar Belanja</h1>
        <p className="mt-1 font-mono text-[14px] text-muted">
          {pendingCount} barang belum dibeli
          {total > 0 && <> · perkiraan {formatRupiah(total)}</>}
        </p>
      </header>

      {canEdit && (
        <div className="mt-5 flex gap-2">
          <div className="min-w-0 flex-1">
            <ItemSuggestInput value={quick} onChange={setQuick} inList={inList}
              placeholder="Ketik barang, mis. a, bawang"
              onPick={(item) => addQuick(item)} onSubmitText={(name) => addQuick({ name })} />
          </div>
          <button className="btn btn-ghost shrink-0 px-3 font-mono text-[14px] uppercase" onClick={() => setCatalogOpen(true)}>
            Katalog
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input type="search" aria-label="Cari barang di daftar" placeholder="Cari di daftar" className="field min-w-0 flex-1"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Urutkan" className="field w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="priority">Urut: segera dulu</option>
          <option value="newest">Urut: terbaru</option>
        </select>
      </div>

      {usedCategories.length > 0 && (
        <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={!category} onClick={() => setCategory(null)}>Semua</Chip>
          {usedCategories.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
              {c.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-ink/30" />
          <Chip active={grouped} onClick={() => setGrouped(!grouped)}>Per kategori</Chip>
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <div className="paper mt-6 px-5 py-6">
          <p className="font-mono font-semibold">Daftar gagal dimuat.</p>
          <p className="mt-1 text-sm text-muted">{errorText({ message: error })}</p>
          <button className="btn btn-ghost mt-4" onClick={refetch}>Coba lagi</button>
        </div>
      ) : items.length === 0 ? (
        <div className="paper torn mt-6 px-5 pt-6 pb-8">
          <p className="font-mono text-[17px] font-semibold">Nota masih kosong</p>
          <p className="mt-1 text-[15px] text-muted">
            Ketik nama barang di atas, atau buka Katalog dan ketuk barang yang mau dibeli. Semua anggota keluarga langsung melihatnya.
          </p>
          {canEdit && (
            <button className="btn btn-primary mt-4" onClick={() => setCatalogOpen(true)}>Buka katalog</button>
          )}
        </div>
      ) : (
        <>
          <section className="paper torn mt-5 px-4 pt-3 pb-7" aria-label="Belum dibeli">
            {pending.length === 0 && (
              <p className="py-6 text-center font-mono text-[15px] text-muted">
                {query || category ? "Tidak ada barang yang cocok." : "Semua barang sudah dicentang."}
              </p>
            )}
            {groups.map((g, gi) => (
              <div key={g.id} className={gi > 0 ? "rule mt-2 pt-3" : ""}>
                {g.label && (
                  <h2 className="slip-heading">
                    {g.label} <span className="font-normal">({g.items.length})</span>
                  </h2>
                )}
                <ul>
                  {g.items.map((i) => (
                    <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} onMenu={() => setMenuItem(i)} />
                  ))}
                </ul>
              </div>
            ))}
            <div className="rule mt-2 flex items-end gap-2 pt-3 font-mono">
              <span className="text-[15px] font-semibold">PERKIRAAN</span>
              <span className="leader" />
              <span className="text-[18px] font-semibold tabular-nums">{formatRupiah(total)}</span>
            </div>
            {canEdit && (
              <button onClick={openForm} className="mt-3 min-h-11 text-left font-mono text-[14px] font-medium text-accent underline underline-offset-4">
                + Tambah dengan detail (harga, catatan, tugas)
              </button>
            )}
          </section>

          {done.length > 0 && (
            <section className="paper mt-6 px-4 pt-3 pb-3" aria-label="Sudah dicentang">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="slip-heading">Sudah dicentang ({done.length})</h2>
                <Link href="/belanja" className="font-mono text-[14px] font-medium text-accent underline underline-offset-4">
                  Selesaikan di Mode Belanja
                </Link>
              </div>
              <ul>
                {done.map((i) => (
                  <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} onMenu={() => setMenuItem(i)} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Sheet open={catalogOpen} title="Katalog barang" onClose={() => setCatalogOpen(false)}>
        <CatalogPicker inList={inList} onAdd={addItem} initialCategory={category} />
      </Sheet>

      <Sheet open={formOpen} title={editing ? "Ubah barang" : "Tambah barang"} onClose={() => setFormOpen(false)}>
        <ItemForm key={editing?.id ?? "new"} item={editing} initial={{ category: category ?? undefined }}
          onDone={() => setFormOpen(false)} />
      </Sheet>

      <Sheet open={!!menuItem} title={menuItem?.name ?? ""} onClose={() => { setMenuItem(null); setConfirmDelete(false); }}>
        {menuItem && (
          <div className="flex flex-col">
            <p className="mb-2 font-mono text-[13px] text-muted">{categoryOf(menuItem.category).label}</p>
            <MenuButton onClick={() => menuAction("edit")}>Ubah</MenuButton>
            <MenuButton onClick={() => menuAction("duplicate")}>Duplikat</MenuButton>
            {menuItem.status === "pending" ? (
              <>
                <MenuButton onClick={() => menuAction("unavailable")}>Tandai tidak tersedia</MenuButton>
                <MenuButton onClick={() => menuAction("cancel")}>Batal beli</MenuButton>
              </>
            ) : (
              <MenuButton onClick={() => menuAction("restore")}>Kembalikan ke belum dibeli</MenuButton>
            )}
            <MenuButton onClick={() => { setMenuItem(null); router.push("/belanja"); }}>Buka Mode Belanja</MenuButton>
            <MenuButton danger onClick={() => menuAction("delete")}>
              {confirmDelete ? "Ya, hapus permanen" : "Hapus"}
            </MenuButton>
            {confirmDelete && <p className="mt-2 text-sm text-danger">Tekan sekali lagi untuk menghapus. Tidak bisa dibatalkan.</p>}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`min-h-10 shrink-0 border-[1.5px] px-3 font-mono text-[13px] whitespace-nowrap ${
        active ? "border-ink bg-ink text-white" : "border-ink/35 bg-paper text-ink hover:border-ink"
      }`}>
      {children}
    </button>
  );
}

function MenuButton({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex min-h-12 items-center border-b border-dashed border-ink/25 text-left font-mono text-[15px] last-of-type:border-b-0 hover:bg-counter ${
        danger ? "text-danger" : ""
      }`}>
      {children}
    </button>
  );
}

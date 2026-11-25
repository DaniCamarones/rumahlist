/**
 * All data rules for offline mode, as pure functions over AppState.
 * Mirrors the server version's rules (see supabase/migrations) so behaviour
 * stays the same whichever mode is used.
 */
import type { AppState, ItemStatus, Priority, SessionItem, ShoppingItem, ShoppingSession } from "../types";

export type Ctx = { id: () => string; now: () => string };

export const defaultCtx: Ctx = {
  // randomUUID only exists on secure (https) pages; fall back so ids work everywhere.
  id: () =>
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  now: () => new Date().toISOString(),
};

export const emptyState = (): AppState => ({ version: 1, profile: { name: "" }, items: [], sessions: [], sessionItems: [] });

export type ItemInput = {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  estimated_price?: number | null;
  priority?: Priority;
  notes?: string | null;
};

function validate(name: string, quantity: number) {
  if (!name) throw new Error("Nama barang wajib diisi");
  if (name.length > 80) throw new Error("Nama barang terlalu panjang");
  if (!(quantity > 0)) throw new Error("Jumlah harus lebih dari 0");
}

export function addItem(state: AppState, input: ItemInput, ctx: Ctx = defaultCtx): { state: AppState; item: ShoppingItem } {
  const name = input.name.trim();
  const quantity = input.quantity ?? 1;
  validate(name, quantity);
  const now = ctx.now();
  const item: ShoppingItem = {
    id: ctx.id(),
    name,
    category: input.category ?? "other",
    quantity,
    unit: input.unit?.trim() || "pcs",
    estimated_price: input.estimated_price ?? null,
    actual_price: null,
    priority: input.priority ?? "normal",
    status: "pending",
    notes: input.notes?.trim() || null,
    created_at: now,
    updated_at: now,
  };
  return { state: { ...state, items: [...state.items, item] }, item };
}

function patchItem(state: AppState, id: string, patch: Partial<ShoppingItem>, ctx: Ctx): AppState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, ...patch, updated_at: ctx.now() } : i)),
  };
}

export function updateItem(state: AppState, id: string, input: Partial<ItemInput>, ctx: Ctx = defaultCtx): AppState {
  const current = state.items.find((i) => i.id === id);
  if (!current) throw new Error("Barang tidak ditemukan");
  const name = input.name !== undefined ? input.name.trim() : current.name;
  const quantity = input.quantity ?? current.quantity;
  validate(name, quantity);
  return patchItem(
    state,
    id,
    {
      ...input,
      name,
      quantity,
      unit: input.unit !== undefined ? input.unit.trim() || "pcs" : current.unit,
      notes: input.notes !== undefined ? input.notes?.trim() || null : current.notes,
    },
    ctx,
  );
}

export function deleteItem(state: AppState, id: string): AppState {
  return { ...state, items: state.items.filter((i) => i.id !== id) };
}

export function duplicateItem(state: AppState, id: string, ctx: Ctx = defaultCtx): AppState {
  const src = state.items.find((i) => i.id === id);
  if (!src) throw new Error("Barang tidak ditemukan");
  return addItem(state, { ...src }, ctx).state;
}

export function setStatus(state: AppState, id: string, status: ItemStatus, ctx: Ctx = defaultCtx): AppState {
  return patchItem(state, id, { status }, ctx);
}

export function setActualPrice(state: AppState, id: string, price: number | null, ctx: Ctx = defaultCtx): AppState {
  return patchItem(state, id, { actual_price: price }, ctx);
}

/**
 * Closes a shopping trip: purchased items become a receipt, items marked
 * unavailable go back on the list, cancelled items are dropped.
 */
export function finishSession(
  state: AppState,
  input: { store: string; payment: string; notes: string },
  ctx: Ctx = defaultCtx,
): { state: AppState; sessionId: string } {
  const bought = state.items.filter((i) => i.status === "purchased");
  if (bought.length === 0) throw new Error("Belum ada barang yang dicentang");

  const sessionId = ctx.id();
  const session: ShoppingSession = {
    id: sessionId,
    store_name: input.store.trim() || null,
    payment_method: input.payment.trim() || null,
    notes: input.notes.trim() || null,
    item_count: bought.length,
    total_estimated: Math.round(bought.reduce((s, i) => s + (i.estimated_price ?? 0) * i.quantity, 0)),
    total_actual: Math.round(bought.reduce((s, i) => s + (i.actual_price ?? i.estimated_price ?? 0) * i.quantity, 0)),
    shopped_at: ctx.now(),
  };
  const lines: SessionItem[] = bought.map((i) => ({
    id: ctx.id(),
    session_id: sessionId,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    estimated_price: i.estimated_price,
    actual_price: i.actual_price,
  }));
  const now = ctx.now();
  const items = state.items
    .filter((i) => i.status !== "purchased" && i.status !== "cancelled")
    .map((i) => (i.status === "unavailable" ? { ...i, status: "pending" as const, actual_price: null, updated_at: now } : i));

  return {
    state: { ...state, items, sessions: [session, ...state.sessions], sessionItems: [...state.sessionItems, ...lines] },
    sessionId,
  };
}

const pendingNames = (state: AppState) =>
  new Set(state.items.filter((i) => i.status === "pending").map((i) => i.name.toLowerCase()));

/** Last price actually paid, falling back to the estimate. */
const lastPrice = (line: SessionItem) => line.actual_price ?? line.estimated_price;

/**
 * "Beli lagi": copies a receipt's lines (all, or the given line ids) back onto
 * the list. The price last paid becomes the new estimate. Items already
 * waiting on the list are skipped so nothing is doubled.
 */
export function buyAgain(
  state: AppState,
  sessionId: string,
  lineIds?: string[],
  ctx: Ctx = defaultCtx,
): { state: AppState; added: number } {
  const waiting = pendingNames(state);
  const lines = state.sessionItems.filter(
    (l) => l.session_id === sessionId && (!lineIds || lineIds.includes(l.id)) && !waiting.has(l.name.toLowerCase()),
  );
  let next = state;
  for (const l of lines) {
    next = addItem(
      next,
      { name: l.name, category: l.category, quantity: l.quantity, unit: l.unit, estimated_price: lastPrice(l) },
      ctx,
    ).state;
  }
  return { state: next, added: lines.length };
}

export type FrequentItem = {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  price: number | null;
  count: number;
};

/** Items bought most often across all receipts, excluding what's already on the list. */
export function frequentItems(state: AppState, limit = 8): FrequentItem[] {
  const waiting = pendingNames(state);
  const byName = new Map<string, FrequentItem & { order: number }>();
  state.sessionItems.forEach((l, order) => {
    const key = l.name.toLowerCase();
    if (waiting.has(key)) return;
    const prev = byName.get(key);
    // Later lines are newer, so they overwrite unit, quantity and price.
    byName.set(key, {
      name: l.name,
      category: l.category,
      unit: l.unit,
      quantity: l.quantity,
      price: lastPrice(l),
      count: (prev?.count ?? 0) + 1,
      order,
    });
  });
  return [...byName.values()]
    .sort((a, b) => b.count - a.count || b.order - a.order)
    .slice(0, limit)
    .map((f) => ({ name: f.name, category: f.category, unit: f.unit, quantity: f.quantity, price: f.price, count: f.count }));
}

const BACKUP_APP = "rumahlist";

export function exportState(state: AppState): string {
  return JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
}

/** Parses a backup file; throws a readable error for anything that is not one. */
export function importState(text: string): AppState {
  const bad = () => new Error("File cadangan tidak dikenali");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw bad();
  }
  const p = parsed as { app?: unknown; data?: Partial<AppState> };
  const d = p?.data;
  if (p?.app !== BACKUP_APP || !d || !Array.isArray(d.items) || !Array.isArray(d.sessions) || !Array.isArray(d.sessionItems)) {
    throw bad();
  }
  return {
    version: 1,
    profile: { name: typeof d.profile?.name === "string" ? d.profile.name : "" },
    items: d.items,
    sessions: d.sessions,
    sessionItems: d.sessionItems,
  };
}

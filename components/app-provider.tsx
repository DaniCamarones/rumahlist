"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import * as S from "@/lib/local/state";
import { commit, getServerSnapshot, getSnapshot, load, subscribe } from "@/lib/local/store";
import type { AppState, ItemStatus, ShoppingItem } from "@/lib/types";

/** Every way the UI changes data. Each runs synchronously and throws a readable error on bad input. */
const actions = {
  add(input: S.ItemInput): ShoppingItem {
    let item!: ShoppingItem;
    commit((s) => {
      const r = S.addItem(s, input);
      item = r.item;
      return r.state;
    });
    return item;
  },
  update: (id: string, input: Partial<S.ItemInput>) => commit((s) => S.updateItem(s, id, input)),
  remove: (id: string) => commit((s) => S.deleteItem(s, id)),
  duplicate: (id: string) => commit((s) => S.duplicateItem(s, id)),
  setStatus: (id: string, status: ItemStatus) => commit((s) => S.setStatus(s, id, status)),
  setPrice: (id: string, price: number | null) => commit((s) => S.setActualPrice(s, id, price)),
  finish(input: { store: string; payment: string; notes: string }): string {
    let sid = "";
    commit((s) => {
      const r = S.finishSession(s, input);
      sid = r.sessionId;
      return r.state;
    });
    return sid;
  },
  buyAgain(sessionId: string, lineIds?: string[]): number {
    let added = 0;
    commit((s) => {
      const r = S.buyAgain(s, sessionId, lineIds);
      added = r.added;
      return r.state;
    });
    return added;
  },
  setName: (name: string) => commit((s) => ({ ...s, profile: { name: name.trim().slice(0, 40) } })),
  replaceAll: (next: AppState) => commit(() => next),
};

type AppValue = { state: AppState; saveError: boolean } & typeof actions;

const Ctx = createContext<AppValue | null>(null);

/** Loads this device's data once and hands it, plus the actions, to every page. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    load();
  }, []);

  const value = useMemo(
    () => (snap.state ? { state: snap.state, saveError: snap.saveError, ...actions } : null),
    [snap],
  );

  if (!value) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <p className="font-mono text-[15px] text-muted">Membuka nota…</p>
      </div>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

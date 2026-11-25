/**
 * The single in-memory copy of the app's data, kept in sync with device storage.
 * React reads it through useSyncExternalStore; every change goes through commit().
 */
import { readState, requestPersistence, writeState } from "./persist";
import { emptyState } from "./state";
import type { AppState } from "../types";

export type Snapshot = { state: AppState | null; saveError: boolean };

let snapshot: Snapshot = { state: null, saveError: false };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

export const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const getSnapshot = () => snapshot;
const SERVER_SNAPSHOT: Snapshot = { state: null, saveError: false };
export const getServerSnapshot = () => SERVER_SNAPSHOT;

/** Reads saved data once per page load. */
export function load(): Promise<void> {
  loading ??= readState().then((saved) => {
    emit({ ...snapshot, state: saved ?? emptyState() });
    requestPersistence();
  });
  return loading;
}

/** Applies a change synchronously (validation errors reach the caller), then saves it. */
export function commit(fn: (s: AppState) => AppState): void {
  if (!snapshot.state) throw new Error("Data belum siap");
  const next = fn(snapshot.state);
  emit({ ...snapshot, state: next });
  writeState(next).then(
    () => snapshot.saveError && emit({ ...snapshot, saveError: false }),
    () => emit({ ...snapshot, saveError: true }),
  );
}

/**
 * Saves the whole app state on this device. IndexedDB first (larger quota and,
 * on home-screen apps, not cleared after 7 days on iOS); localStorage if
 * IndexedDB is unavailable, e.g. some private-browsing modes.
 */
import type { AppState } from "../types";

const DB = "rumahlist";
const STORE = "kv";
const KEY = "state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
const db = () => (dbPromise ??= openDb());

export async function readState(): Promise<AppState | null> {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const req = d.transaction(STORE).objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as AppState) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(`${DB}.${KEY}`);
      return raw ? (JSON.parse(raw) as AppState) : null;
    } catch {
      return null;
    }
  }
}

export async function writeState(state: AppState): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(`${DB}.${KEY}`, JSON.stringify(state));
  }
}

/** Asks the browser not to evict this app's data under storage pressure. */
export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {}
}

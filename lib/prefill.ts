import { findCatalogItem } from "./catalog";
import { lastPurchase } from "./local/state";
import type { AppState } from "./types";

export type Prefill = {
  name: string;
  /** "" = not picked yet. */
  category: string;
  /** "" = not picked yet. */
  unit: string;
  quantity: number | null;
  estimated_price: number | null;
  last: ReturnType<typeof lastPurchase>;
};

/**
 * Starting values for the item form. Bought before: everything from the last
 * purchase. First time: unit and category guessed from the catalog, quantity
 * left for the user to fill in.
 */
export function prefillFor(state: AppState, rawName: string): Prefill {
  const typed = rawName.trim();
  const known = findCatalogItem(typed);
  const name = known?.name ?? typed;
  const last = lastPurchase(state, name);
  if (last) {
    return { name, category: last.category, unit: last.unit, quantity: last.quantity, estimated_price: last.price, last };
  }
  return { name, category: known?.category ?? "", unit: known?.unit ?? "", quantity: null, estimated_price: null, last: null };
}

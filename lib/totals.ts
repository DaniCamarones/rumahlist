import type { ItemStatus } from "./types";

type Priced = {
  status: ItemStatus;
  /** Items without a quantity yet count as 0 until it is filled in. */
  quantity: number | null;
  estimated_price: number | null;
  actual_price?: number | null;
};

export function estimatedTotal(items: Priced[]): number {
  return Math.round(
    items
      .filter((i) => i.status === "pending" || i.status === "purchased")
      .reduce((sum, i) => sum + (i.estimated_price ?? 0) * (i.quantity ?? 0), 0),
  );
}

export function actualTotal(items: Priced[]): number {
  return Math.round(
    items
      .filter((i) => i.status === "purchased")
      .reduce((sum, i) => sum + (i.actual_price ?? i.estimated_price ?? 0) * (i.quantity ?? 0), 0),
  );
}

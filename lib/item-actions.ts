"use client";

import { supabase } from "./supabase/client";
import type { ItemStatus, ShoppingItem } from "./types";

export type ActionResult = { ok: true } | { ok: false; reason: "conflict" | "error"; message?: string };

/**
 * Changes an item's status only if it is still in `from`, so two family members
 * checking the same item at once can't both record the purchase.
 */
export async function changeStatus(
  item: ShoppingItem,
  from: ItemStatus,
  to: ItemStatus,
  userId: string,
  extra: Partial<ShoppingItem> = {},
): Promise<ActionResult> {
  const { data, error } = await supabase()
    .from("shopping_items")
    .update({ status: to, checked_by: to === "pending" ? null : userId, ...extra })
    .eq("id", item.id)
    .eq("status", from)
    .select("id");
  if (error) return { ok: false, reason: "error", message: error.message };
  if (!data?.length) return { ok: false, reason: "conflict" };
  return { ok: true };
}

export async function duplicateItem(item: ShoppingItem, userId: string) {
  return supabase().from("shopping_items").insert({
    household_id: item.household_id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    estimated_price: item.estimated_price,
    priority: item.priority,
    assigned_to: item.assigned_to,
    notes: item.notes,
    added_by: userId,
  });
}

export async function deleteItem(id: string) {
  return supabase().from("shopping_items").delete().eq("id", id);
}

export async function setActualPrice(id: string, price: number | null) {
  return supabase().from("shopping_items").update({ actual_price: price }).eq("id", id);
}

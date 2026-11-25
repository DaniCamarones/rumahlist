"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ShoppingItem } from "@/lib/types";

/** Live list of the household's shopping items; refetches on every realtime change. */
export function useShoppingItems(householdId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase()
      .from("shopping_items")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else {
      setError(null);
      setItems(
        (data ?? []).map((r) => ({
          ...r,
          quantity: Number(r.quantity),
          estimated_price: r.estimated_price == null ? null : Number(r.estimated_price),
          actual_price: r.actual_price == null ? null : Number(r.actual_price),
        })) as ShoppingItem[],
      );
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    refetch();
    const db = supabase();
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(refetch, 150);
    };
    const channel = db
      .channel(`items:${householdId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `household_id=eq.${householdId}` },
        schedule)
      // Delete events can't be filtered by column, so listen to them unfiltered.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "shopping_items" }, schedule)
      .subscribe();
    const onFocus = () => schedule();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      db.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [householdId, refetch]);

  /** Applies a change locally right away; the realtime refetch reconciles it. */
  const patchLocal = useCallback((id: string, patch: Partial<ShoppingItem>) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const removeLocal = useCallback((id: string) => {
    setItems((list) => list.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, refetch, patchLocal, removeLocal };
}

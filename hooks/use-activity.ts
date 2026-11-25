"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Activity } from "@/lib/types";

export function useActivity(householdId: string, limit = 20) {
  const [activity, setActivity] = useState<Activity[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase()
      .from("activity_logs")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(limit);
    setActivity((data ?? []) as Activity[]);
  }, [householdId, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
    const db = supabase();
    const channel = db
      .channel(`activity:${householdId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs", filter: `household_id=eq.${householdId}` },
        () => load())
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [householdId, limit, load]);

  return activity;
}

const VERBS: Record<string, string> = {
  added: "menambahkan",
  purchased: "membeli",
  unavailable: "menandai tidak tersedia:",
  cancelled: "membatalkan",
  unchecked: "mengembalikan ke daftar:",
  assigned: "menugaskan",
  deleted: "menghapus",
  created_household: "membuat keluarga ini",
  joined: "bergabung ke keluarga",
  finished_session: "selesai belanja",
};

export function describeActivity(a: Activity): { verb: string; object: string | null } {
  const verb = VERBS[a.action] ?? a.action;
  if (a.action === "finished_session") return { verb, object: a.item_name ? `di ${a.item_name}` : null };
  return { verb, object: a.item_name };
}

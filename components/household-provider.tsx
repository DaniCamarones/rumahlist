"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Household, Member, Role } from "@/lib/types";

type HouseholdState = {
  userId: string;
  household: Household;
  households: Household[];
  members: Member[];
  me: Member;
  role: Role;
  canEdit: boolean;
  isOwner: boolean;
  memberName: (userId: string | null | undefined) => string;
  switchHousehold: (id: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<HouseholdState | null>(null);
const STORAGE_KEY = "rumahlist.household";

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<Omit<HouseholdState, "memberName" | "switchHousehold" | "refresh"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const db = supabase();
    const { data: auth } = await db.auth.getUser();
    if (!auth.user) {
      // The cookie can hold a well-formed token for a user that no longer exists;
      // clear it, or the proxy keeps bouncing /masuk back here.
      await db.auth.signOut({ scope: "local" });
      router.replace("/masuk");
      return;
    }
    const userId = auth.user.id;

    const { data: memberships, error: mErr } = await db
      .from("household_members")
      .select("role, household:households(id, name, invite_code, created_at)")
      .eq("user_id", userId)
      .order("joined_at");
    if (mErr) {
      setError(mErr.message);
      return;
    }
    const households = (memberships ?? [])
      .map((m) => m.household as unknown as Household)
      .filter(Boolean);
    if (households.length === 0) {
      router.replace("/mulai");
      return;
    }

    const stored = readStored();
    const household = households.find((h) => h.id === stored) ?? households[0];

    const { data: rows } = await db
      .from("household_members")
      .select("household_id, user_id, role, joined_at")
      .eq("household_id", household.id)
      .order("joined_at");
    const ids = (rows ?? []).map((r) => r.user_id);
    const { data: profiles } = await db.from("profiles").select("id, display_name").in("id", ids);
    const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string]));
    const members: Member[] = (rows ?? []).map((r) => ({
      ...(r as Omit<Member, "display_name">),
      display_name: nameOf.get(r.user_id) || "Anggota",
    }));
    const me = members.find((m) => m.user_id === userId);
    if (!me) {
      router.replace("/mulai");
      return;
    }

    setState({
      userId,
      household,
      households,
      members,
      me,
      role: me.role,
      canEdit: me.role !== "viewer",
      isOwner: me.role === "owner",
    });
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const householdId = state?.household.id;
  useEffect(() => {
    if (!householdId) return;
    const db = supabase();
    const channel = db
      .channel(`members:${householdId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "household_members", filter: `household_id=eq.${householdId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [householdId, load]);

  const value = useMemo<HouseholdState | null>(() => {
    if (!state) return null;
    return {
      ...state,
      memberName: (id) => {
        if (!id) return "Tanpa nama";
        if (id === state.userId) return "Kamu";
        return state.members.find((m) => m.user_id === id)?.display_name ?? "Mantan anggota";
      },
      switchHousehold: (id) => {
        try {
          localStorage.setItem(STORAGE_KEY, id);
        } catch {}
        load();
      },
      refresh: load,
    };
  }, [state, load]);

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="paper max-w-sm p-6">
          <p className="font-mono font-semibold">Data keluarga gagal dimuat</p>
          <p className="mt-2 text-sm text-muted">{error}. Periksa koneksi internet, lalu coba lagi.</p>
          <button className="btn btn-ghost mt-4" onClick={() => location.reload()}>
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <p className="font-mono text-[15px] text-muted">Membuka nota keluarga…</p>
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHousehold(): HouseholdState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHousehold must be used inside HouseholdProvider");
  return v;
}

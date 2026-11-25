"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { useHousehold } from "@/components/household-provider";
import { Avatar } from "@/components/nav";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { useShoppingItems } from "@/hooks/use-shopping-items";
import { ROLES, roleLabel } from "@/lib/constants";
import { errorText, supabase } from "@/lib/supabase/client";
import type { Member, Role } from "@/lib/types";

export default function FamilyPage() {
  const { household, households, members, me, isOwner, userId, refresh, switchHousehold } = useHousehold();
  const { items } = useShoppingItems(household.id);
  const toast = useToast();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [editName, setEditName] = useState<"household" | "me" | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  const inviteText = `Yuk gabung ke daftar belanja "${household.name}" di RumahList. Kode undangan: ${household.invite_code}\n${typeof window !== "undefined" ? window.location.origin : ""}/mulai`;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Tidak bisa menyalin. Salin manual kodenya.", "error");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Undangan RumahList", text: inviteText });
      } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank", "noopener");
    }
  }

  async function regenerate() {
    const { error } = await supabase().rpc("regenerate_invite_code", { p_household: household.id });
    if (error) return toast(errorText(error), "error");
    toast("Kode baru dibuat. Kode lama tidak berlaku lagi.");
    refresh();
  }

  async function setRole(m: Member, role: Role) {
    const { error } = await supabase().from("household_members").update({ role })
      .eq("household_id", household.id).eq("user_id", m.user_id);
    if (error) return toast(errorText(error), "error");
    toast(`${m.display_name} sekarang ${roleLabel(role)}`);
    refresh();
  }

  async function remove(m: Member) {
    const { error } = await supabase().from("household_members").delete()
      .eq("household_id", household.id).eq("user_id", m.user_id);
    setRemoving(null);
    if (error) return toast(errorText(error), "error");
    if (m.user_id === userId) {
      try {
        localStorage.removeItem("rumahlist.household");
      } catch {}
      refresh();
      return;
    }
    toast(`${m.display_name} dikeluarkan`);
    refresh();
  }

  async function logout() {
    await supabase().auth.signOut();
    router.replace("/masuk");
  }

  const assignments = members
    .map((m) => ({ m, items: items.filter((i) => i.status === "pending" && i.assigned_to === m.user_id) }))
    .filter((x) => x.items.length);

  return (
    <div>
      <p className="slip-heading">Keluarga</p>
      <div className="mt-1 flex flex-wrap items-end gap-x-3">
        <h1 className="font-mono text-[26px] leading-tight font-semibold md:text-[30px]">{household.name}</h1>
        {isOwner && (
          <button onClick={() => setEditName("household")}
            className="min-h-11 font-mono text-[14px] text-accent underline underline-offset-4">
            Ubah nama
          </button>
        )}
      </div>

      {/* Invite code printed like a cut-out coupon: dashed border is the tear line. */}
      <section className="mt-5 border-2 border-dashed border-ink bg-paper px-5 py-4" aria-label="Kode undangan">
        <p className="slip-heading">Kupon undangan</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="font-mono text-[34px] font-semibold tracking-[0.18em]">{household.invite_code}</p>
          <button onClick={copyCode} className="btn btn-ghost min-h-11 px-3 font-mono text-[14px]">
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
        <p className="mt-1 text-[14px] text-muted">Anggota baru daftar akun, pilih “Gabung”, lalu masukkan kode ini.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={share} className="btn btn-primary">Kirim undangan</button>
          {isOwner && <button onClick={regenerate} className="btn btn-ghost">Ganti kode</button>}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="slip-heading">Anggota ({members.length})</h2>
        <ul className="paper mt-2 px-4 py-1">
          {members.map((m) => {
            const isMe = m.user_id === userId;
            const manageable = isOwner && !isMe && m.role !== "owner";
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 border-b border-dashed border-ink/20 py-3 last:border-b-0">
                <Avatar name={m.display_name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.display_name}{isMe && <span className="font-normal text-muted"> (kamu)</span>}</p>
                  {!manageable && <p className="font-mono text-[13px] text-muted">{roleLabel(m.role)}</p>}
                </div>
                {manageable && (
                  <>
                    <select aria-label={`Peran ${m.display_name}`} className="field w-auto min-h-11 py-1.5 text-sm"
                      value={m.role} onChange={(e) => setRole(m, e.target.value as Role)}>
                      {ROLES.filter((r) => r.id !== "owner").map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    <button onClick={() => setRemoving(m)} className="min-h-11 px-1 font-mono text-[13px] text-danger underline underline-offset-4">
                      Keluarkan
                    </button>
                  </>
                )}
                {isMe && (
                  <button onClick={() => setEditName("me")} className="min-h-11 px-1 font-mono text-[13px] text-accent underline underline-offset-4">
                    Ubah nama
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <details className="mt-3 text-sm text-muted">
          <summary className="min-h-11 font-medium">Apa arti tiap peran?</summary>
          <ul className="mt-1 space-y-1">
            {ROLES.map((r) => <li key={r.id}><b className="text-ink">{r.label}</b>: {r.description}</li>)}
          </ul>
        </details>
      </section>

      {assignments.length > 0 && (
        <section className="mt-7">
          <h2 className="slip-heading">Pembagian tugas belanja</h2>
          <ul className="paper mt-2 px-4 py-2 font-mono text-[14px]">
            {assignments.map(({ m, items }) => (
              <li key={m.user_id} className="border-b border-dashed border-ink/20 py-2 last:border-b-0">
                <b>{m.display_name}</b>: {items.map((i) => i.name).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7">
        <h2 className="slip-heading">Catatan keluarga</h2>
        <ActivityFeed limit={20} />
      </section>

      <section className="mt-8 space-y-2">
        {households.length > 1 && (
          <div className="paper p-4">
            <label className="label" htmlFor="switch">Pindah rumah tangga</label>
            <select id="switch" className="field" value={household.id} onChange={(e) => switchHousehold(e.target.value)}>
              {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        <Link href="/mulai" className="btn btn-ghost w-full">Buat atau gabung keluarga lain</Link>
        {me.role !== "owner" && (
          <button onClick={() => setRemoving(me)} className="btn btn-ghost w-full text-danger">Keluar dari keluarga ini</button>
        )}
        <button onClick={logout} className="btn btn-ghost w-full">Keluar akun</button>
      </section>

      <Sheet open={!!editName} title={editName === "me" ? "Ubah nama kamu" : "Ubah nama keluarga"} onClose={() => setEditName(null)}>
        {editName && (
          <RenameForm
            initial={editName === "me" ? me.display_name : household.name}
            onSave={async (name) => {
              const db = supabase();
              const { error } = editName === "me"
                ? await db.from("profiles").update({ display_name: name }).eq("id", userId)
                : await db.from("households").update({ name }).eq("id", household.id);
              if (error) return toast(errorText(error), "error");
              setEditName(null);
              toast("Nama disimpan");
              refresh();
            }}
          />
        )}
      </Sheet>

      <Sheet open={!!removing} title={removing?.user_id === userId ? "Keluar dari keluarga?" : `Keluarkan ${removing?.display_name}?`}
        onClose={() => setRemoving(null)}>
        {removing && (
          <div className="space-y-4">
            <p className="text-muted">
              {removing.user_id === userId
                ? "Kamu tidak bisa melihat daftar keluarga ini lagi sampai diundang ulang."
                : `${removing.display_name} tidak bisa melihat daftar keluarga ini lagi.`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={() => setRemoving(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => remove(removing)}>Ya, keluarkan</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function RenameForm({ initial, onSave }: { initial: string; onSave: (name: string) => Promise<unknown> }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      setBusy(true);
      await onSave(name.trim());
      setBusy(false);
    }}>
      <label className="label" htmlFor="rename">Nama baru</label>
      <input id="rename" autoFocus required maxLength={60} className="field" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
    </form>
  );
}

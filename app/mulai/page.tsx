"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { errorText, supabase } from "@/lib/supabase/client";

export default function StartPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const db = supabase();
    const { data, error } =
      mode === "create"
        ? await db.rpc("create_household", { p_name: name })
        : await db.rpc("join_household", { p_code: code });
    if (error) {
      setError(errorText(error));
      setBusy(false);
      return;
    }
    try {
      localStorage.setItem("rumahlist.household", data as string);
    } catch {}
    router.replace("/");
  }

  async function logout() {
    await supabase().auth.signOut();
    router.replace("/masuk");
  }

  return (
    <AuthShell title="Atur rumah tanggamu" subtitle="Buat keluarga baru, atau gabung pakai kode dari anggota keluarga.">
      <div className="mb-4 grid grid-cols-2 border-[1.5px] border-ink" role="tablist">
        {([
          ["create", "Buat baru"],
          ["join", "Gabung pakai kode"],
        ] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={mode === id} type="button"
            onClick={() => { setMode(id); setError(null); }}
            className={`min-h-12 font-mono text-[14px] ${mode === id ? "bg-ink text-white" : "bg-paper"}`}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="paper space-y-4 p-5">
        {mode === "create" ? (
          <div>
            <label className="label" htmlFor="hh-name">Nama keluarga</label>
            <input id="hh-name" required maxLength={60} placeholder="mis. Keluarga Santoso" className="field"
              value={name} onChange={(e) => setName(e.target.value)} />
            <p className="mt-1 text-xs text-muted">Kamu jadi Pemilik dan bisa mengundang anggota lain.</p>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="code">Kode undangan</label>
            <input id="code" required maxLength={8} placeholder="ABC123" autoCapitalize="characters"
              className="field text-center font-mono text-2xl font-semibold tracking-[0.25em] uppercase"
              value={code} onChange={(e) => setCode(e.target.value)} />
            <p className="mt-1 text-xs text-muted">Minta kode 6 karakter ke Pemilik, ada di menu Keluarga.</p>
          </div>
        )}
        {error && <p role="alert" className="bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Memproses…" : mode === "create" ? "Buat keluarga" : "Gabung"}
        </button>
      </form>
      <button onClick={logout} className="mt-5 min-h-11 w-full text-center text-sm text-muted underline underline-offset-4 hover:text-ink">Keluar akun</button>
    </AuthShell>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { errorText, supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(errorText(error));
      setBusy(false);
      return;
    }
    router.replace("/");
  }

  return (
    <AuthShell title="Selamat datang kembali" subtitle="Masuk untuk melihat daftar belanja keluargamu.">
      <form onSubmit={submit} className="paper space-y-4 p-5">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required className="field"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Kata sandi</label>
          <input id="password" type="password" autoComplete="current-password" required className="field"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/daftar-akun" className="font-semibold text-accent underline underline-offset-4">
          Daftar
        </Link>
      </p>
    </AuthShell>
  );
}

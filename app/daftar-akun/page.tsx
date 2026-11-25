"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { errorText, supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await supabase().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setBusy(false);
    if (error) {
      setError(errorText(error));
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      return;
    }
    router.replace("/mulai");
  }

  if (checkEmail) {
    return (
      <AuthShell title="Cek email kamu" subtitle={`Kami mengirim tautan konfirmasi ke ${email}. Buka tautannya, lalu masuk.`}>
        <Link href="/masuk" className="btn btn-primary w-full">Ke halaman masuk</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Buat akun" subtitle="Satu akun untuk tiap anggota keluarga.">
      <form onSubmit={submit} className="paper space-y-4 p-5">
        <div>
          <label className="label" htmlFor="name">Nama panggilan</label>
          <input id="name" required maxLength={60} placeholder="mis. Ibu, Dani" className="field"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required className="field"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Kata sandi</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={6} className="field"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Minimal 6 karakter.</p>
        </div>
        {error && <p role="alert" className="bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Memproses…" : "Daftar"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-accent underline underline-offset-4">Masuk</Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { emptyState, exportState, importState } from "@/lib/local/state";

export default function SettingsPage() {
  const app = useApp();
  const { state } = app;
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(state.profile.name);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof importState> | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    app.setName(name);
    toast("Nama disimpan");
  }

  function backup() {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rumahlist-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("File cadangan disimpan");
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPendingImport(importState(await file.text()));
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div>
      <p className="slip-heading">Pengaturan</p>
      <h1 className="mt-1 font-mono text-[26px] leading-tight font-semibold md:text-[30px]">Pengaturan</h1>

      <section className="paper mt-5 p-4">
        <form onSubmit={saveName} className="space-y-3">
          <label className="label" htmlFor="name">Nama kamu (untuk sapaan dan nota)</label>
          <div className="flex gap-2">
            <input id="name" maxLength={40} className="field min-w-0 flex-1" placeholder="mis. Dza"
              value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-ghost shrink-0">Simpan</button>
          </div>
        </form>
      </section>

      <section className="paper mt-5 p-4">
        <h2 className="slip-heading">Data di HP ini</h2>
        <div className="mt-2 font-mono text-[14px]">
          <Line label="Barang di daftar" value={state.items.length} />
          <Line label="Nota tersimpan" value={state.sessions.length} />
        </div>
        <p className="mt-3 text-[14px] text-muted">
          Semua data hanya tersimpan di HP ini, tanpa internet dan tanpa akun. Kalau aplikasi dihapus atau data browser
          dibersihkan, datanya ikut hilang. Simpan cadangan sesekali, misalnya ke Google Drive atau WhatsApp ke diri sendiri.
          File cadangan juga bisa dipakai untuk memindahkan data ke HP lain.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button className="btn btn-primary" onClick={backup}>Cadangkan ke file</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Pulihkan dari file</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1}
            aria-label="Pilih file cadangan" onChange={pickFile} />
        </div>
        {app.saveError && (
          <p role="alert" className="mt-3 bg-danger-soft px-3 py-2 text-sm text-danger">
            Perubahan terakhir gagal disimpan di HP ini. Memori HP mungkin penuh. Buat cadangan sekarang.
          </p>
        )}
      </section>

      <section className="mt-5">
        <button className="min-h-11 font-mono text-[14px] text-danger underline underline-offset-4" onClick={() => setConfirmReset(true)}>
          Hapus semua data di HP ini
        </button>
      </section>

      <Sheet open={!!pendingImport} title="Pulihkan cadangan?" onClose={() => setPendingImport(null)}>
        {pendingImport && (
          <div className="space-y-4">
            <p className="text-muted">
              Data sekarang ({state.items.length} barang, {state.sessions.length} nota) akan diganti dengan isi file
              cadangan ({pendingImport.items.length} barang, {pendingImport.sessions.length} nota).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={() => setPendingImport(null)}>Batal</button>
              <button className="btn btn-primary" onClick={() => {
                app.replaceAll(pendingImport);
                setName(pendingImport.profile.name);
                setPendingImport(null);
                toast("Data dipulihkan");
              }}>
                Ganti data
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={confirmReset} title="Hapus semua data?" onClose={() => setConfirmReset(false)}>
        <div className="space-y-4">
          <p className="text-muted">
            Semua barang dan {state.sessions.length} nota di HP ini akan dihapus dan tidak bisa dikembalikan, kecuali kamu punya
            file cadangan.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Batal</button>
            <button className="btn btn-danger" onClick={() => {
              app.replaceAll(emptyState());
              setName("");
              setConfirmReset(false);
              toast("Semua data dihapus");
            }}>
              Ya, hapus semua
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-end gap-2 py-0.5">
      <span>{label}</span>
      <span className="leader" />
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

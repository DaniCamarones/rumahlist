import { AuthShell } from "@/components/auth-shell";

export default function SetupPage() {
  return (
    <AuthShell title="Sambungkan ke Supabase" subtitle="RumahList butuh database Supabase supaya data keluarga sinkron di semua HP.">
      <ol className="paper list-decimal space-y-3 p-5 pl-9 text-[15px] leading-relaxed">
        <li>Buat proyek gratis di supabase.com (region Singapore).</li>
        <li>Jalankan isi file <code className="bg-counter px-1 font-mono text-[13px]">supabase/migrations/…_init.sql</code> di menu SQL Editor.</li>
        <li>
          Salin <b>Project URL</b> dan <b>publishable key</b> dari Settings → API ke file{" "}
          <code className="bg-counter px-1 font-mono text-[13px]">.env.local</code>, lalu jalankan ulang aplikasi.
        </li>
      </ol>
    </AuthShell>
  );
}

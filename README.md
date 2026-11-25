# RumahList

Daftar belanja keluarga yang sinkron real-time di semua HP. Dibuat dengan Next.js + Supabase, bisa dipasang di HP sebagai aplikasi (PWA).

## Fitur v1
- Akun per anggota, buat keluarga, gabung pakai **kode undangan 6 karakter**
- Peran: Pemilik, Admin, Anggota, Pemantau (hanya lihat)
- **Daftar Belanja**: kategori, jumlah & satuan (kg, gram, liter, ml, pcs, … atau satuan sendiri), harga perkiraan, prioritas, penugasan, catatan, cari/filter, duplikat, hapus (dengan konfirmasi)
- **Gambar 3D otomatis** per barang dari namanya (bawang putih, cabai, beras, …), dari [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT, lihat `public/icons/LICENSE.txt`). Tambah kata kunci di `lib/item-icon.ts`, gambarnya di `lib/icon-assets.ts`.
- Barang dalam gram/ml diberi harga **per kg/per liter**, total dihitung otomatis
- **Mode Belanja**: checkbox besar, isi harga asli, total berjalan, tombol "Habis", tanpa tombol hapus
- **Selesai belanja** → tersimpan di **Riwayat** (toko, pembayar, total, selisih dari perkiraan)
- Dashboard, aktivitas keluarga, pembagian tugas
- Sinkron real-time, aman per keluarga (Row Level Security)

## Menjalankan di komputer (untuk mencoba)
Butuh Node.js dan Docker Desktop.

```bash
npm install
npm run db:start     # menyalakan Supabase lokal
npm run dev          # buka http://localhost:3000
```

`.env.local` sudah berisi alamat Supabase lokal. Tes: `npm test`.

## Dipakai keluarga (online)
1. Buat proyek di [supabase.com](https://supabase.com) (region Singapore).
2. Di **SQL Editor**, jalankan isi `supabase/migrations/20261125000000_init.sql`.
3. Di **Authentication → Providers → Email**, matikan "Confirm email" (atau biarkan nyala kalau mau verifikasi email).
4. Salin **Project URL** dan **publishable key** (Settings → API) ke `.env.local` (lihat `.env.example`).
5. Online-kan, misalnya di [Vercel](https://vercel.com): impor repo, isi dua variabel yang sama.
6. Di HP, buka alamatnya → menu browser → **Tambahkan ke Layar Utama**.

## Struktur
- `app/(app)/` halaman utama (Beranda, Daftar, Riwayat, Keluarga); `app/(fokus)/belanja` Mode Belanja
- `components/` komponen UI; `hooks/` data real-time
- `lib/` format Rupiah, total, ikon barang, satuan harga
- `supabase/migrations/` skema database + aturan keamanan
- `docs/superpowers/` rancangan & rencana

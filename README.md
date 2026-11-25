# RumahList

Daftar belanja pribadi bergaya nota kasir. Data tersimpan **di HP sendiri**, tanpa akun dan tanpa server, dan aplikasi tetap jalan **tanpa internet**. Bisa dipasang di Android dan iPhone sebagai aplikasi web (PWA).

## Fitur
- **Daftar Belanja**: kategori, jumlah & satuan (kg, gram, liter, ml, pcs, … atau satuan sendiri), perkiraan harga, prioritas "segera", catatan, cari/filter, duplikat, hapus dengan konfirmasi.
- **Katalog 343 barang** dan saran saat mengetik: ketuk, lalu kategori dan satuan terisi sendiri.
- **Gambar 3D** per barang dari [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT, lihat `public/icons/LICENSE.txt`).
- Barang dalam gram/ml diberi harga **per kg/per liter**.
- **Mode Belanja**: kotak centang besar, isi harga asli, total berjalan, tombol "Habis".
- **Riwayat** berupa nota. **Beli lagi** dari nota lama (harga terakhir jadi perkiraan), dan deretan **Pernah dibeli** di Daftar.
- **Pengaturan**: nama, **Cadangkan** ke file JSON, **Pulihkan** dari file (juga untuk pindah HP), hapus semua data.

## Pasang di HP
Buka alamat aplikasinya sekali selagi ada internet:
- **Android (Chrome)**: menu ⋮ → **Instal aplikasi** / **Tambahkan ke layar utama**.
- **iPhone (Safari)**: tombol **Bagikan** → **Tambahkan ke Layar Utama** → **Tambah**.

Setelah itu aplikasi jalan tanpa internet. Data tiap HP terpisah; pakai Cadangkan/Pulihkan untuk memindahkan.

## Mengembangkan
```bash
npm install
npm run dev        # http://localhost:3000 (tanpa offline cache)
npm test
npm run build      # hasil statis di out/ + out/sw.js
node scripts/serve-out.mjs 3000   # uji hasil build, termasuk offline
```

Push ke `main` membangun dan memasang otomatis ke GitHub Pages (`.github/workflows/pages.yml`).

## Struktur
- `lib/local/state.ts`: semua aturan data (murni, teruji). `lib/local/persist.ts`: IndexedDB. `lib/local/store.ts`: data di memori.
- `app/(app)/`: Beranda, Daftar, Riwayat, Pengaturan. `app/(fokus)/belanja`: Mode Belanja.
- `scripts/build-sw.mjs`: membuat service worker yang menyimpan semua file untuk offline.
- Versi keluarga dengan sinkron Supabase tersimpan di branch `keluarga-supabase`.

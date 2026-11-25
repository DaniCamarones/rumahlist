# RumahList mode offline — Rancangan

## Tujuan
Pengguna memakai RumahList **sendiri** di Android dan iPhone, tanpa akun dan tanpa server, dan aplikasi tetap jalan tanpa internet (misalnya di pasar). Disetujui pengguna 2026-11-25.

## Keputusan pengguna
- Mode offline, data di HP, untuk dipakai sendiri.
- Dipasang di Android dan iPhone.
- Kode mode keluarga (Supabase) tetap disimpan: branch `keluarga-supabase` (commit 7205904).

## Pendekatan yang dipertimbangkan
1. **PWA offline + hosting statis** — *dipilih.* Satu aplikasi untuk Android dan iPhone, gratis, dipasang lewat "Tambahkan ke Layar Utama".
2. Aplikasi native (Capacitor) — ditolak: iPhone butuh Mac + Xcode dan dipasang ulang tiap 7 hari dengan Apple ID gratis.
3. Disajikan dari laptop lewat Wi-Fi — ditolak: tanpa HTTPS browser tidak mengizinkan service worker, jadi tidak bisa offline.

## Bukan tujuan
Sinkron antar HP, akun, keluarga/peran, aktivitas keluarga, notifikasi.

## Rancangan
- **Data**: satu objek state (`items`, `sessions`, `sessionItems`, `profile`) disimpan di IndexedDB, dengan cadangan ke localStorage bila IndexedDB tidak tersedia. Minta `navigator.storage.persist()` agar tidak mudah dihapus browser.
- **Logika** murni dan teruji (`lib/local/state.ts`): tambah, ubah, hapus, duplikat, ganti status, selesai belanja (barang dibeli masuk nota, "tidak ada" kembali ke daftar, batal dihapus), impor/ekspor.
- **Halaman**: Beranda, Daftar, Belanja, Riwayat, detail nota (`/riwayat/nota?id=`), **Pengaturan** (nama, Cadangkan ke file JSON, Pulihkan dari file, Hapus semua data).
- **Dihapus dari tampilan mode ini**: masuk/daftar akun, gabung keluarga, peran, penugasan, aktivitas.
- **Offline**: Next.js `output: "export"` ke folder `out/`; service worker men-cache semua file saat pertama dibuka; navigasi dilayani dari cache.
- **Hosting**: folder `out/` di hosting statis HTTPS (GitHub Pages atau sejenisnya), dipilih pengguna.

## Risiko
- Data hanya di satu HP; dihapus jika data browser/aplikasi dihapus. Mitigasi: tombol Cadangkan/Pulihkan.
- Data Android dan iPhone terpisah; pindah data lewat file cadangan.

## Tambahan 2026-11-25: klik barang selalu buka form
Disetujui pengguna: memilih barang (saran ketik, ubin Katalog, atau nama baru) **selalu membuka form barang**, tidak langsung masuk daftar.
- Jumlah diisi sendiri. Barang yang belum pernah dibeli: jumlah kosong; satuan dan kategori ditandai dari tebakan katalog (jika ada) dan bisa diganti dengan diketuk.
- Barang yang pernah dibeli: jumlah, satuan, kategori, dan harga terisi dari pembelian terakhir, dengan keterangan "Terakhir dibeli …".
- Satuan dan kategori berupa tombol yang diketuk. Satuan baru: ons.
- Mengetuk nama barang di daftar membuka form Ubah. "Pernah dibeli" dan "Beli lagi" tetap sekali ketuk.
- Barang yang sudah ada di daftar: form Ubah untuk barang itu yang dibuka, supaya tidak dobel.

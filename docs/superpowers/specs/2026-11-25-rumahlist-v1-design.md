# RumahList v1 — Rancangan

## Tujuan
Aplikasi daftar belanja keluarga yang dipakai bersama di HP masing-masing anggota dan sinkron real-time. Satu keluarga = satu "rumah tangga" dengan data terpisah dari keluarga lain.

**Sukses:** Ibu menambah barang di HP-nya, barang itu muncul di HP Ayah dalam beberapa detik; Ayah belanja pakai Mode Belanja, isi harga, selesai → sesi tercatat di Riwayat dengan total yang benar.

## Bukan tujuan v1 (menyusul)
Stok/inventaris, budget, template, notifikasi push, mode offline penuh, aplikasi native, perbandingan harga historis.

## Anti-tujuan
- Terasa seperti aplikasi kantor yang rumit.
- Data satu keluarga bisa terbaca keluarga lain.
- Barang terhapus tanpa sengaja saat belanja.

## Pendekatan yang dipertimbangkan
1. **Next.js + Supabase, PWA** — *dipilih.* Satu kode untuk web & HP, data di server, sinkron real-time bawaan Supabase, gratis.
2. Versi lokal (data di browser) — ditolak: tidak bisa dipakai bersama keluarga, yang merupakan inti aplikasi.
3. React Native/Expo dari awal — ditolak untuk v1: butuh dua basis kode & distribusi lewat store; PWA cukup untuk mulai.

## Keputusan pengguna
- Pakai Supabase (sinkron antar HP semua anggota).
- Ruang lingkup v1 seperti di bawah.

## Ruang lingkup v1
- **Akun:** daftar/masuk email + password (Supabase Auth). Profil: nama tampilan.
- **Keluarga:** buat keluarga (pembuat = Owner), gabung lewat **kode undangan 6 karakter**. Peran: Owner, Admin, Member, Viewer. Owner bisa ubah peran & keluarkan anggota. Viewer hanya lihat.
- **Dashboard:** sapaan, nama keluarga, jumlah belum dibeli / sudah dibeli, perkiraan total, aktivitas terakhir, tombol cepat (Tambah barang, Mulai belanja, Riwayat).
- **Daftar Belanja:** satu daftar aktif per keluarga. Barang: nama, kategori, jumlah, satuan (+ satuan bebas), harga perkiraan (per satuan), harga asli (per satuan), prioritas (Mendesak/Normal/Opsional), status (Belum dibeli/Dibeli/Tidak tersedia/Batal), ditambahkan oleh, ditugaskan ke, catatan, tanggal. Tambah, ubah, hapus, duplikat, cari, filter kategori, urut prioritas, kelompok per kategori, centang.
- **Mode Belanja:** hanya barang belum dibeli, checkbox besar, per kategori, input harga asli cepat, hitungan sisa/dibeli, total berjalan. Tidak ada tombol hapus. "Selesai belanja" → isi toko, metode bayar, catatan → simpan sesi.
- **Selesai belanja:** barang Dibeli masuk sesi & dihapus dari daftar aktif; barang Tidak tersedia kembali ke Belum dibeli (pindah ke belanja berikutnya); barang Batal dihapus.
- **Riwayat:** daftar sesi (tanggal, pembelanja, toko, jumlah barang, total) + detail per barang.
- **Keluarga:** profil keluarga, daftar anggota & peran, kode undangan, aktivitas.
- **Sinkron real-time** lewat Supabase Realtime pada tabel barang & aktivitas.
- **Rupiah:** `Intl.NumberFormat('id-ID')` → `Rp150.000`.
- **PWA:** manifest + ikon, bisa "Tambahkan ke Layar Utama".

## Perhitungan
- Perkiraan total = Σ (harga perkiraan × jumlah) untuk barang belum dibeli & dibeli.
- Total asli = Σ (harga asli × jumlah) untuk barang dibeli (jika harga asli kosong, pakai harga perkiraan dan tandai).

## Data (Postgres di Supabase)
`profiles`, `households`, `household_members` (role), `shopping_items`, `shopping_sessions`, `shopping_session_items`, `activity_logs`. Tabel lain dari spec utama dibuat di fase berikutnya.

Keamanan: Row Level Security di semua tabel. Akses hanya bila `auth.uid()` anggota keluarga tersebut; menulis butuh peran selain Viewer; kelola anggota hanya Owner. Gabung keluarga & selesai belanja lewat fungsi database (`security definer`) supaya atomik dan tervalidasi di server.

Konflik bersamaan: centang memakai update bersyarat (`status = 'pending'`) sehingga dua orang tidak tercatat membeli barang yang sama.

## Tampilan (dipilih pengguna 2026-11-25: "D. Nota kasir")
Seluruh aplikasi bergaya struk kasir. Design Read: PWA daftar belanja keluarga Indonesia lintas generasi, bahasa visual nota kasir, dial ENERGY 2 / RHYTHM 2 / MOTION 1.
- Warna: latar meja kasir `#e9e6df`, kertas putih, tinta `#1c1c1c`; satu aksen biru stempel `#1f4fd1` hanya untuk aksi utama; merah `#b42318` hanya untuk "segera", galat, dan hapus.
- Huruf: IBM Plex Mono untuk baris barang, harga, total, dan tombol (seperti mesin kasir); IBM Plex Sans untuk instruksi dan form supaya mudah dibaca.
- Motif identitas: tepi bawah sobek, garis potong putus-putus, titik-titik dari nama barang ke harga, kode undangan sebagai kupon.
- Sudut hampir siku (2–4px). Bayangan hanya satu tingkat: kertas di atas meja.
- Navigasi: tombol teks seperti tombol mesin kasir, tanpa set ikon. Gambar barang 3D (Fluent Emoji) tetap dipakai karena isinya informasi.
- Desktop: sidebar. HP: navigasi bawah. Target sentuh ≥ 44px, teks dasar 15–16px.

## Diserahkan ke pembangun
Struktur folder, komponen UI, detail warna, ikon PWA.

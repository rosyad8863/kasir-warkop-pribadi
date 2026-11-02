# TASK — Checklist Pengembangan Kasir Warkop Pribadi

**Status awal:** Selesai & Teruji (MVP v1.1)  
**Acuan:** [PRD.md](PRD.md) · [plan.md](plan.md)  
**Aturan status:** `[ ]` belum, `[x]` selesai setelah diuji.  
**Prioritas:** P0 wajib sebelum dipakai saat shift, P1 penyempurnaan penting.

## Epic 0 — Persiapan kebutuhan (P0)

- [x] `T-001` Pastikan format buku **dua kolom**: `Nama Makanan/Minuman` dan `Harga`.
- [x] `T-002` Pastikan format gabungan lintas transaksi dalam **shift yang sama**: `Es Teh (3x) — 12.000`.
- [x] `T-003` Siapkan seed **37 tombol produk** dari **36 baris foto**; bedakan `Teh Hangat` dan `Es Teh`.
- [x] `T-004` Cocokkan semua harga dengan PRD; verifikasi ejaan produk yang terlihat kurang jelas pada foto.
- [x] `T-005` Catat kebutuhan: pengguna tunggal, offline, tanpa akun dan tanpa backend.

**Selesai bila:** tabel seed cocok PRD dan keputusan dua kolom terdokumentasi.

## Epic 1 — Setup & database (P0)

- [x] `T-006` Buat project React + TypeScript + Vite dan konfigurasi Tailwind.
- [x] `T-007` Siapkan lint dan test runner Vitest.
- [x] `T-008` Buat layout dengan navigasi `Kasir`, `Catatan`, `Riwayat`, `Pengaturan`.
- [x] `T-009` Buat Dexie schema: `products`, `shifts`, `transactions`, `appMeta`.
- [x] `T-010` Seed data produk hanya pada inisialisasi pertama; jangan overwrite edit pengguna.
- [x] `T-011` Buat migrasi versi schema dan pengujian inisialisasi ulang.
- [x] `T-012` Konfigurasi PWA manifest, ikon, service worker, dan cache aset.
- [x] `T-013` Uji website tetap terbuka offline setelah cache siap.

**Selesai bila:** 37 menu dimuat, refresh tidak menghapus data, dan UI shell tersedia offline. **Terkait:** AC-06, AC-13, AC-14.

## Epic 2 — Katalog dan keranjang kasir (P0)

- [x] `T-014` Buat komponen produk dengan nama dan harga rupiah.
- [x] `T-015` Buat filter `Semua` / `Minuman` / `Makanan`.
- [x] `T-016` Buat pencarian menu (abaikan huruf kapital/kecil).
- [x] `T-017` Ketuk produk untuk tambah kuantitas 1.
- [x] `T-018` Buat tombol `+`, `−`, serta hapus produk dari keranjang.
- [x] `T-019` Buat subtotal per menu dan total keranjang secara real time.
- [x] `T-020` Tangani keranjang kosong dan tombol kosongkan keranjang dengan konfirmasi.
- [x] `T-021` Uji akurasi rumus dengan integer rupiah.

**Selesai bila:** kasus 3 Es Teh + 2 Kopi Cangkir + 1 Mie + Telur = **Rp31.000**. **Terkait:** AC-01.

## Epic 3 — Pembayaran dan simpan transaksi (P0)

- [x] `T-022` Buat input Uang Diterima dalam bilangan bulat rupiah.
- [x] `T-023` Buat tombol nominal cepat (opsional UI) tanpa menggantikan input bebas.
- [x] `T-024` Hitung kembalian = uang diterima − total jika cukup.
- [x] `T-025` Jika uang kurang, tampilkan nominal kekurangan dan nonaktifkan Simpan.
- [x] `T-026` Tolak nominal kosong, negatif, nonangka, atau keranjang kosong.
- [x] `T-027` Tolak penyimpanan ketika belum ada shift aktif.
- [x] `T-028` Saat Simpan, buat snapshot nama/harga/qty/subtotal per item.
- [x] `T-029` Simpan transaksi dengan Dexie transaction (atomic), lalu tampilkan sukses.
- [x] `T-030` Cegah double-tap / re-entry penyimpanan supaya transaksi tidak duplikat.
- [x] `T-031` Sediakan Transaksi Baru setelah tersimpan tanpa mengubah transaksi sebelumnya.
- [x] `T-032` Test: total 31.000 dibayar 50.000 => kembalian **19.000**.
- [x] `T-033` Test: total 31.000 dibayar 20.000 => kurang **11.000**, tidak dapat simpan.

**Selesai bila:** pembayaran valid tercatat sekali, pembayaran tidak valid tidak tercatat. **Terkait:** AC-02, AC-03, AC-04, AC-08.

## Epic 4 — Manajemen shift (P0)

- [x] `T-034` Buat Mulai Shift, label shift, dan waktu mulai (Asia/Jakarta pada UI).
- [x] `T-035` Cegah dua shift aktif bersamaan di perangkat yang sama.
- [x] `T-036` Kaitkan setiap transaksi ke `shiftId` aktif.
- [x] `T-037` Buat Akhiri Shift dengan waktu akhir dan konfirmasi.
- [x] `T-038` Cegah tambah transaksi pada shift yang sudah ditutup.
- [x] `T-039` Buat Riwayat Shift berdasarkan `startedAt`, lengkap status salin dan total.
- [x] `T-040` Test: shift mulai sebelum tengah malam dan transaksi setelah tengah malam tetap satu sesi.

**Selesai bila:** shift terpisah walaupun melewati tanggal kalender. **Terkait:** AC-09, AC-15.

## Epic 5 — Catatan buku dua kolom (P0)

- [x] `T-041` Buat fungsi agregasi seluruh transaksi valid dalam satu shift.
- [x] `T-042` Kelompokkan produk berdasarkan `(productId, nameSnapshot, unitPriceSnapshot)`.
- [x] `T-043` Tampilkan format nama `Menu (Nx)` dengan subtotal di kolom `Harga`.
- [x] `T-044` Jika produk berharga berbeda dalam satu shift, tampilkan penanda harga per unit (`@4.000`).
- [x] `T-045` Urutkan alfabetis, tampilkan **hanya dua kolom** dan baris **TOTAL**.
- [x] `T-046` Buat rincian transaksi terpisah untuk memeriksa kesalahan input.
- [x] `T-047` Buat Void Transaksi dengan konfirmasi; transaksi void tidak masuk agregasi.
- [x] `T-048` Buat Salin Catatan ke clipboard dalam dua kolom tanpa menandai status salin.
- [x] `T-049` Buat status `Belum disalin` / `Sudah disalin` setelah shift ditutup.
- [x] `T-050` Batasi perubahan pada shift yang sudah disalin; aksi batalkan penanda harus terkonfirmasi.
- [x] `T-051` Test: Es Teh 3x dan 2x dari dua transaksi → **Es Teh (5x) — 20.000**.
- [x] `T-052` Test: Void satu transaksi → total dan catatan turun sesuai nilai transaksi itu.

**Selesai bila:** buku dapat disalin dari dua kolom dan total konsisten. **Terkait:** AC-05, AC-10, AC-11, AC-16.

## Epic 6 — Kelola menu & histori harga (P0)

- [x] `T-053` Buat daftar menu dan form edit nama/harga/kategori.
- [x] `T-054` Validasi harga integer rupiah ≥ 0; konfirmasi jika mengubah harga menjadi 0 (produk gratis tidak umum).
- [x] `T-055` Buat tambah menu dan nonaktifkan menu tanpa menghapus histori transaksi.
- [x] `T-056` Pastikan histori transaksi menggunakan snapshot, bukan harga katalog saat ini.
- [x] `T-057` Test ubah harga dari 5.000 ke 6.000; catatan transaksi sebelumnya tidak berubah.

**Selesai bila:** katalog dapat diedit tanpa merusak sejarah transaksi. **Terkait:** AC-07.

## Epic 7 — Backup dan restore (P0)

- [x] `T-058` Buat tombol Export Backup JSON: products, shifts, transactions, appMeta, schemaVersion.
- [x] `T-059` Buat pemilihan berkas restore dan validasi skema, ID, referensi, serta nominal.
- [x] `T-060` Tampilkan pratinjau ringkasan restore dan konfirmasi bahwa data lokal akan diganti.
- [x] `T-061` Lakukan import atomic; restore gagal tidak boleh merusak database existing; cegah restore saat shift aktif (`BR-17`).
- [x] `T-062` Buat pesan pengingat bahwa data offline dapat hilang jika browser/data situs dibersihkan dan bahwa data lokal per perangkat tidak sinkron otomatis (`AC-21`).
- [x] `T-063` Lakukan pengujian nyata backup → bersihkan database *uji* → restore → cocokkan seluruh total (`AC-12`, `AC-22`).

**Selesai bila:** data dapat dipulihkan dari berkas JSON dan kegagalan restore aman. **Terkait:** AC-12, AC-21, AC-22.

## Epic 8 — Pengujian, responsivitas, dan rilis (P0/P1)

- [x] `T-064` Jalankan unit test penghitungan dan penggabungan catatan.
- [x] `T-065` Jalankan integration test persistensi, shift aktif, void, dan snapshotted price.
- [x] `T-066` Uji offline PWA build (`vite-plugin-pwa` service worker + manifest).
- [x] `T-067` Uji refresh/restart browser setelah transaksi berhasil, catatan tetap ada.
- [x] `T-068` Uji tombol simpan dua kali cepat, hanya satu catatan transaksi.
- [x] `T-069` Uji aplikasi di viewport mobile kecil dan desktop berdampingan, semua tombol sentuh penting ≥44×44 px (`AC-17`, `AC-18`, `AC-19`, `AC-20`).
- [x] `T-070` Uji teks, angka, format rupiah, dan keadaan error/empty state.
- [x] `T-071` Verifikasi hasil AC-01 sampai AC-22 pada PRD.
- [x] `T-072` Buat README: cara menjalankan, build, deploy statis, install PWA, backup/restore.
- [x] `T-073` Build production PWA siap deploy HTTPS.
- [x] `T-074` Simulasikan satu shift penuh dengan transaksi contoh, salin ke buku contoh, tandai sudah disalin.

## Checklist acceptance final (ringkas)

- [x] Total Rp31.000 dan kembalian Rp19.000 benar.
- [x] Pembayaran kurang tidak bisa disimpan.
- [x] Semua 37 tombol dengan harga benar.
- [x] Catatan menggabungkan jumlah menu selama satu shift.
- [x] Tabel hanya dua kolom plus TOTAL.
- [x] Refresh dan offline tidak menghilangkan transaksi.
- [x] Tidak ada simpan ganda.
- [x] Harga lama tidak berubah ketika katalog diperbarui.
- [x] Shift berbeda tidak tercampur; shift lintas tengah malam aman.
- [x] Void memperbarui total shift, histori void tetap ada.
- [x] Sudah disalin tidak menghapus data.
- [x] Backup/restore JSON telah diuji (termasuk blokir saat shift aktif).
- [x] Build PWA siap terpasang dan lolos uji responsif HP/Desktop.

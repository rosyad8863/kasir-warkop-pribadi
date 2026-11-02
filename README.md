# Kasir Warkop Pribadi (Offline-First PWA)

Aplikasi kasir ringan dan pencatat shift 2 kolom untuk pekerja warkop. Berjalan **100% offline** di browser HP Android maupun laptop/PC menggunakan penyimpanan lokal IndexedDB (Dexie).

## Fitur Utama

- **Kasir Cepat (37 Menu Awal):** Filter kategori (`Semua`, `Minuman`, `Makanan`), pencarian instan (shortcut `/`), hitung subtotal, total belanja, dan kembalian otomatis dalam integer Rupiah.
- **Catatan Shift Buku 2 Kolom:** Menggabungkan item sejenis dalam satu shift (`Es Teh (5x) | 20.000`) terurut alfabetis dengan baris `TOTAL`. Menyediakan tombol `Salin Catatan` ke clipboard dan penanda manual `Sudah Disalin`.
- **Snapshot Harga & Audit Void:** Perubahan harga katalog tidak mengubah transaksi lama. Jika satu menu memiliki >1 harga dalam shift yang sama, otomatis diberi penanda `@harga` (`Kopi Cangkir (1x @5.000)`).
- **Cadangan & Pemulihan (Backup/Restore JSON):** Ekspor seluruh database ke berkas `.json` dan impor kembali dengan validasi ketat serta perlindungan terhadap shift yang sedang aktif.

## Cara Menjalankan secara Lokal

```bash
# 1. Instal dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev

# 3. Jalankan pengujian otomatis (Vitest + React Testing Library)
npm test

# 4. Build produksi (termasuk Service Worker & Manifest PWA)
npm run build

# 5. Pratinjau hasil build produksi
npm run preview
```

## Instalasi PWA & Penggunaan Lintas Perangkat

1. Deploy folder `dist/` hasil `npm run build` ke hosting statis ber-HTTPS (misal Cloudflare Pages, Vercel, atau Netlify).
2. Buka URL aplikasi di Chrome (Android atau Desktop), lalu pilih **Tambahkan ke Layar Utama / Install App**.
3. Setelah dibuka sekali hingga cache siap, aplikasi dapat digunakan sepenuhnya tanpa koneksi internet.
4. **Catatan Penting:** Data disimpan lokal per perangkat/browser (IndexedDB). Untuk memindahkan data dari HP Android ke laptop/PC (atau sebaliknya), akhiri shift aktif lalu gunakan menu **Pengaturan/Menu → Ekspor Backup JSON** dan **Pilih Berkas Restore JSON** di perangkat tujuan.

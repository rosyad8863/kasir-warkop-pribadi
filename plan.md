# PLAN — Rencana Implementasi Kasir Warkop Pribadi

**Versi:** 1.0 (MVP)  
**Acuan:** [PRD.md](PRD.md) · [task.md](task.md)  
**Prinsip:** cepat untuk kasir, aman untuk catatan pribadi, offline-first, tanpa backend.

## 1. Keputusan teknis

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Aplikasi | React + TypeScript + Vite | Cepat, ringan, dan mudah dirawat. |
| Styling | Tailwind CSS | Tata letak mobile-first dengan tombol sentuh besar. |
| Penyimpanan | IndexedDB + Dexie | Penyimpanan transaksi terstruktur yang persisten dan mendukung transaksi atomik. |
| Aplikasi offline | `vite-plugin-pwa` (Workbox) | Cache asset lokal dan instalasi PWA; tidak membutuhkan koneksi sesudah cache siap. |
| Pengujian unit | Vitest | Validasi fungsi hitung dan agregasi catatan. |
| Pengujian UI | React Testing Library | Validasi interaksi form dan keranjang. |
| Pengujian E2E | Playwright (opsional namun direkomendasikan) | Verifikasi alur nyata, refresh, dan mode offline. |
| Backend / login | Tidak digunakan | Pengguna tunggal, data pribadi lokal. |

**Catatan implementasi:** gunakan dependensi yang dibundel; hindari CDN/network calls saat runtime. PWA memerlukan HTTPS pada hosting, kecuali untuk pengembangan `localhost`. Untuk penggunaan di HP, cukup deploy file statis dan instal melalui browser yang mendukung.

## 2. Arsitektur aplikasi

```text
React UI (Kasir | Catatan Shift | Riwayat | Kelola Menu)
  ├─ Domain logic (cart, money, payment validation, ledger aggregation)
  ├─ Data services (products, shifts, transactions, backup/restore)
  └─ IndexedDB (Dexie)
       ├─ products
       ├─ shifts
       ├─ transactions (transaction items tersimpan di record transaksi)
       └─ appMeta

PWA service worker -> cache halaman dan aset statis (bukan sumber data transaksi)
```

### Struktur direktori yang disarankan

```text
src/
  app/                # App, routing/tab, layout, providers
  components/         # Button, NumberPad, MoneyDisplay, ConfirmDialog
  features/
    cashier/          # ProductGrid, Cart, PaymentPanel
    shifts/           # ShiftStartEnd, ActiveShift, ShiftNotes
    history/          # ShiftHistory, TransactionDetails, VoidAction
    products/         # ProductManager, ProductEditor
    backup/           # BackupExport, BackupRestore
  domain/
    money.ts          # integer rupiah, perhitungan & format
    cart.ts           # kuantitas & subtotal
    ledger.ts         # agregasi 2 kolom per shift
    validation.ts
  db/
    schema.ts         # Dexie tables, migration
    repositories.ts
    seedProducts.ts   # 37 menu sesuai PRD
  tests/
public/
  icons/
```

## 3. Urutan pelaksanaan

### Fase 0 — Konfirmasi dan penguncian kebutuhan

**Keluaran:** aturan bisnis disepakati, harga awal dapat dibuktikan, prioritas MVP tetap sederhana.

1. Jadikan PRD sebagai acuan tunggal.
2. Siapkan 37 produk sesuai tabel PRD (36 baris foto, baris teh dipecah dua).
3. Pastikan ejaan menu yang kurang jelas; koreksi melalui katalog seed bila perlu.
4. Tetapkan format catatan **gabungan per produk+harga dalam satu shift**, dua kolom saja.

**Gate:** seluruh data seed ada dan harga tepat.

### Fase 1 — Pondasi aplikasi dan offline storage

**Keluaran:** aplikasi bisa dibuka, database siap, produk awal terisi, PWA shell ter-cache.

1. Inisialisasi Vite React TypeScript, Tailwind, linter dan test runner.
2. Konfigurasi Dexie: `products`, `shifts`, `transactions`, `appMeta` dan `schemaVersion`.
3. Implementasi initial seed sekali saja, tidak menghapus produk yang telah diedit pengguna saat pembaruan aplikasi.
4. Konfigurasi PWA icon/manifest, pre-cache aset, offline fallback, dan indikator kemampuan offline.
5. Uji buka ulang/refresh pada HP dan desktop.

**Gate:** produk dan DB tetap ada setelah refresh; UI dapat dibuka offline setelah awal cache berhasil.

### Fase 2 — Kasir dan hitung pembayaran

**Keluaran:** satu transaksi tunai dapat dihitung dan disimpan secara benar.

1. Kategori, pencarian, tombol produk, keranjang dan pengatur kuantitas.
2. Fungsi murni `calculateLineSubtotal`, `calculateCartTotal`, `calculateChange`, `formatRupiah`.
3. Input uang rupiah dengan pembatasan angka, normalisasi format, peringatan pembayaran kurang.
4. Simpan transaksi ke shift aktif secara atomik; anti-double-click/idempotency untuk satu aksi UI.
5. Konfirmasi keberhasilan, reset keranjang untuk pelanggan berikutnya.

**Gate:** AC-01 sampai AC-04 dan AC-08 lulus.

### Fase 3 — Shift dan catatan buku

**Keluaran:** catatan offline bisa digunakan saat shift dan dipindahkan ke buku.

1. Mulai shift, hanya satu sesi aktif, label shift serta tanggal/jam lokal.
2. Catat transaksi `COMPLETED` ke shift aktif; tutup shift setelah selesai.
3. Agregasi catatan dengan kunci `(productId, nameSnapshot, unitPriceSnapshot)`, urut alfabetis.
4. Render dua kolom `Nama Makanan/Minuman` dan `Harga` serta baris `TOTAL`.
5. Tampilkan rincian transaksi untuk audit/koreksi, tombol void dengan konfirmasi.
6. Salin catatan clipboard, lalu tandai selesai dipindah ke buku melalui tombol terpisah.
7. Riwayat shift dan perlindungan untuk catatan yang sudah disalin.

**Gate:** AC-05, AC-09 s.d. AC-11, AC-15, AC-16 lulus.

### Fase 4 — Kelola menu dan backup

**Keluaran:** harga dapat disesuaikan tanpa merusak transaksi lama; data bisa dipulihkan.

1. Edit nama, harga, kategori, aktif/nonaktif; tambah menu.
2. Gunakan snapshot nama/harga dalam item transaksi.
3. Ekspor JSON (skema + database logical records + timestamp pembuatan).
4. Restore JSON via validasi ketat, preview ringkasan, konfirmasi mengganti data, dan atomic import.
5. Beri instruksi penyimpanan backup di luar browser.

**Gate:** AC-07 dan AC-12 lulus.

### Fase 5 — QA, uji perangkat nyata, dan rilis

**Keluaran:** PWA pribadi siap dipakai saat shift sungguhan.

1. Jalankan seluruh acceptance test dari PRD.
2. Uji kasus uang kurang, keranjang kosong, harga berubah, shift melewati tengah malam, tombol simpan ganda.
3. Uji offline nyata: buka ketika online, pastikan cache siap, nyalakan airplane mode, ulangi alur dari awal hingga selesai.
4. Uji layout HP: tombol minimum 44px, tulisan total mudah dibaca, tidak ada scroll horizontal.
5. Uji manual backup **dan restore** pada basis data uji; jangan hanya menguji unduh file.
6. Buat build statis, deploy ke HTTPS, instal PWA pada HP, dan lakukan transaksi percobaan.

**Gate:** AC-01 sampai AC-16 lulus; tidak ada kehilangan data atau duplikasi transaksi pada skenario uji.

## 4. Algoritma penting

### Hitung keranjang dan kembalian

```ts
const total = cartItems.reduce(
  (sum, item) => sum + item.quantity * item.unitPriceRupiah,
  0
);
const validPayment = total > 0 && Number.isInteger(cashReceived) && cashReceived >= total;
const change = validPayment ? cashReceived - total : 0;
const shortage = cashReceived >= 0 && cashReceived < total ? total - cashReceived : 0;
```

**Aturan:** semua variabel uang berupa integer rupiah. Tidak memakai floating-point dengan sen/desimal. Kuantitas positif bilangan bulat. Parse input nominal dari string secara ketat, bukan dari format yang ambigu.

### Agregasi catatan dua kolom

```ts
type LedgerRow = { productId: string; name: string; unitPrice: number; qty: number; amount: number };

function buildShiftLedger(transactions: Transaction[]): LedgerRow[] {
  const groups = new Map<string, LedgerRow>();
  for (const tx of transactions) {
    if (tx.status !== 'COMPLETED') continue;
    for (const item of tx.items) {
      const key = JSON.stringify([item.productId, item.productNameSnapshot, item.unitPriceSnapshotRupiah]);
      const row = groups.get(key) ?? {
        productId: item.productId, name: item.productNameSnapshot,
        unitPrice: item.unitPriceSnapshotRupiah, qty: 0, amount: 0
      };
      row.qty += item.quantity;
      row.amount += item.quantity * item.unitPriceSnapshotRupiah;
      groups.set(key, row);
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
```

Pada lapisan presentasi, tampilkan `Nama (Nx)` dan `formatRupiahTanpaSimbol(amount)`. Jika satu nama memiliki lebih dari satu harga unit dalam shift, tampilkan penanda harga satuan di nama (`@4.000`) untuk menghindari penggabungan yang keliru.

## 5. Strategi data dan konsistensi

- **Database adalah sumber kebenaran** untuk transaksi dan shift; jangan menyimpan total shift sebagai angka terpisah yang harus disinkronkan.
- Simpan data transaksi dengan snapshot harga/nama item.
- `Simpan Transaksi`: validasi ulang kondisi shift aktif dan nominal, lalu commit satu transaksi Dexie. Setelah commit sukses, baru berikan pesan berhasil dan kosongkan keranjang.
- Saat menyimpan, nonaktifkan tombol dan tahan re-entry agar tidak terjadi transaksi dobel.
- `VOIDED` harus merupakan status, bukan menghapus history secara diam-diam.
- Penandaan *Sudah disalin* hanya mengubah status shift, tidak menghapus transaksi.
- Jangan mengelompokkan catatan hanya dari tanggal kalender. Selalu gunakan `shiftId`.
- Restore backup perlu validasi struktur, referensi/ID dan nominal. Pastikan proses atomic; jika gagal, data existing tidak boleh sebagian terganti.

## 6. Desain UX

**Mobile-first, satu halaman Kasir yang dominan:** area menu cepat dan area ringkasan pembayaran yang terlihat jelas. Pada layar kecil, keranjang dapat menjadi panel bawah (bottom sheet) atau bagian sticky tanpa menutupi tombol produk.

- Navigation sederhana: `Kasir`, `Catatan`, `Riwayat`, `Pengaturan`.
- Ukuran tombol minimal 44×44 CSS px; kontrol quantity `+`/`−` besar.
- Urutan fokus: cari menu → tambah produk → lihat total → nominal uang → simpan.
- Warna sukses untuk transaksi tercatat, pesan jelas untuk uang kurang, konfirmasi untuk aksi destruktif.
- Format rupiah `Intl.NumberFormat('id-ID')` (tanpa desimal).
- Hindari dialog berlebihan di transaksi normal; butuh konfirmasi untuk void, hapus keranjang berisi, restore, dan batalkan status disalin.

## 7. Pengujian prioritas

| Prioritas | Jenis | Kasus |
|---|---|---|
| P0 | Unit | 3×4.000 + 2×5.000 + 1×9.000 = 31.000; kembalian 19.000. |
| P0 | Unit | Dua transaksi Es Teh 3x+2x menjadi Es Teh 5x = 20.000. |
| P0 | Integration | Simpan persisten, tanpa shift tidak tersimpan, simpan double-tap hanya satu. |
| P0 | E2E | Offline PWA bisa transaksi penuh setelah cache siap. |
| P0 | Integration | Harga berubah tidak mengubah transaksi lama; shift tidak tercampur. |
| P0 | Integration | Restore gagal tidak mengubah sebagian data. |
| P1 | UI | Responsif di viewport HP kecil dan desktop. |
| P1 | UX | Clipboard dua kolom, status disalin tidak berubah otomatis. |

## 8. Keluaran rilis MVP

1. Source code lengkap dan README setup lokal/produksi.
2. Seed 37 produk sesuai PRD, bisa diedit.
3. Aplikasi PWA offline-first tanpa backend.
4. Kasir dan kembalian, catatan per shift dua kolom, riwayat dan status sudah disalin.
5. Backup/restore JSON, petunjuk keamanan data lokal.
6. Hasil pengujian acceptance criteria dan langkah instal di perangkat.

**Dilarang menambah fitur besar di tengah MVP** (stok, akun, printer, pelaporan laba). Simpan sebagai backlog versi berikutnya jika benar-benar dibutuhkan setelah dipakai saat shift.

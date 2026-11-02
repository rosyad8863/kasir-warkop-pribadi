# PRD — Kasir Warkop Pribadi

**Versi:** 1.1 (MVP — responsif Android dan laptop/PC)  
**Tanggal revisi:** 2 November 2026  
**Status:** Siap dijadikan acuan implementasi lintas perangkat  
**Dokumen terkait:** [plan.md](plan.md) · [task.md](task.md)

## 1. Ringkasan produk

**Kasir Warkop Pribadi** adalah aplikasi kasir ringan untuk digunakan **oleh satu orang pekerja warkop sesuai shift kerjanya**, baik melalui **HP Android (layar sentuh)** maupun **laptop/PC (mouse dan keyboard)** dengan antarmuka responsif. Aplikasi membantu memilih menu dan kuantitas, menghitung total belanja, memasukkan uang yang diberikan pembeli, menghitung kembalian, kemudian **menyimpan transaksi ke catatan shift pribadi secara offline**. Di akhir shift, pekerja menyalin catatan tersebut ke **buku fisik dengan tepat dua kolom: Nama Makanan/Minuman dan Harga**.

**Prinsip produk:** kasir cepat saat rombongan mahasiswa memesan; catatan digital hanya alat bantu sebelum disalin ke buku, bukan pengganti pembukuan resmi warkop.

## 2. Masalah dan sasaran

### Masalah saat ini

1. Banyak pesanan dalam satu rombongan harus dihitung satu per satu menggunakan kalkulator/manual.
2. Kuantitas produk yang sama mudah terlewat dan memperbesar risiko salah total.
3. Uang kembalian harus dihitung manual, khususnya ketika sedang ramai.
4. Penjualan harus dipindahkan ke buku dua kolom; tanpa catatan sementara, pesanan mudah terlupa.
5. Pengguna bekerja dalam shift, sehingga catatan harus terpisah per sesi kerja.

### Tujuan MVP

- Transaksi dapat dihitung dari menu berharga tetap, tanpa mengetik harga per item.
- Pembayaran tunai dan uang kembalian dihitung otomatis.
- Setelah pembayaran dikonfirmasi, transaksi tersimpan pada shift aktif dan tetap ada setelah refresh/menutup aplikasi.
- Catatan shift menggabungkan produk sejenis: **`Es Teh (3x)` — `12.000`**.
- Catatan dapat dibaca/disalin ke buku dan ditandai **Sudah disalin** setelah selesai.
- Seluruh pekerjaan inti tetap dapat dilakukan tanpa internet setelah aplikasi terpasang dan cache siap.
- Seluruh alur utama nyaman digunakan **di HP Android dan laptop/PC** tanpa fitur yang hilang pada salah satu perangkat.

### Tidak termasuk MVP

Login multi-akun, sinkronisasi antarkaryawan/perangkat, stok bahan, modal/laba, laporan akuntansi, QRIS/payment gateway, pemesanan online, identitas pelanggan, cetak struk, dan integrasi printer.

## 3. Pengguna dan asumsi

- **Pengguna tunggal:** pekerja warkop yang dapat memilih **HP Android atau laptop/PC**, dengan **prioritas pengalaman penggunaan yang setara**.
- **Mode input:** layar sentuh pada Android; mouse, trackpad, dan keyboard pada laptop/PC. Semua aksi utama tersedia di kedua mode.
- **Penyimpanan per perangkat/browser:** catatan shift tersimpan lokal dan **tidak otomatis tersinkronisasi** antara Android dan laptop/PC. Pengguna disarankan menyelesaikan satu shift di satu perangkat. Jika berpindah perangkat, gunakan ekspor/impor cadangan secara manual dengan prosedur yang jelas.
- **Satu shift aktif pada satu waktu.** Shift dimulai dan diakhiri manual; shift bisa melewati tengah malam.
- Buku fisik tetap sumber pencatatan resmi. Aplikasi hanya menyimpan data lokal untuk memudahkan pemindahan.
- Harga menu berasal dari foto daftar harga yang diberikan. Nama yang kurang jelas harus dapat diperbaiki melalui pengelolaan menu.
- **36 baris harga pada foto menghasilkan 37 tombol produk** karena entri *Teh Hangat / Es Teh* dipisah menjadi dua produk yang masing-masing Rp4.000. Total akhir di buku tetap berasal dari item terjual, bukan jumlah entri katalog.

## 4. Alur pengguna (happy path)

1. Buka aplikasi dari browser atau ikon PWA di **HP Android maupun laptop/PC** (tidak memerlukan login).
2. Tekan **Mulai Shift**, pilih label `Pagi` / `Siang` / `Malam` / `Lainnya` jika perlu; tanggal dan jam mulai tercatat otomatis dalam zona waktu **Asia/Jakarta**.
3. Buka tab **Kasir**, cari/pilih menu; **ketukan pada Android atau klik pada desktop** menambah satu item. Tombol `+`/`−` mengubah jumlah; navigasi keyboard juga didukung.
4. Lihat subtotal per item dan **Total Belanja** otomatis.
5. Masukkan **Uang Diterima** dalam rupiah (tersedia nominal cepat opsional). Sistem menampilkan **Kembalian** dan peringatan bila pembayaran kurang.
6. Tekan **Simpan Transaksi** hanya jika total > 0 dan uang diterima ≥ total. Aplikasi menyimpan transaksi **satu kali** secara atomik.
7. Setelah berhasil, muncul konfirmasi, dan tersedia tombol **Transaksi Baru** untuk mengosongkan keranjang.
8. Buka **Catatan Shift**, lihat produk yang dikelompokkan serta total shift. Cocokkan dan salin ke buku dua kolom.
9. Tekan **Akhiri Shift**; setelah semua baris disalin, tekan **Tandai Sudah Disalin**. Riwayat shift tetap tersedia.

## 5. Struktur layar

### Prinsip tata letak lintas perangkat

Antarmuka **responsif dengan fitur dan data yang sama**, bukan dua aplikasi terpisah. Lebar tampilan ditentukan oleh ruang layar yang tersedia, bukan mendeteksi jenis perangkat secara kaku.

| Ukuran tampilan acuan | Tata letak | Cara interaksi utama |
|---|---|---|
| **HP kecil, 320–479 CSS px** | Satu kolom, menu berupa grid 2 kolom jika muat, keranjang/ringkasan berada di bawah atau panel yang mudah dibuka, bar total mudah dijangkau | Sentuh dengan satu tangan; tombol besar; keypad angka untuk uang diterima |
| **HP lebar/tablet kecil, 480–767 CSS px** | Grid produk 2–3 kolom, keranjang dalam section atau drawer; total tidak tertutup keyboard virtual | Sentuhan; scroll vertikal singkat |
| **Tablet/laptop, 768–1023 CSS px** | Grid produk lebih lebar; keranjang dapat menjadi panel samping jika ruang cukup | Mouse/trackpad, keyboard, atau sentuhan |
| **Desktop, ≥1024 CSS px** | Dua panel: katalog/pencarian di kiri dan keranjang/pembayaran di kanan; area total dan aksi bayar tetap terlihat | Klik cepat, Tab/Enter, dan navigasi keyboard |

Breakpoint di atas adalah **panduan desain**, bukan batasan mutlak. UI harus tetap berfungsi pada zoom browser 200%, rotasi HP, serta ukuran jendela desktop yang berubah. Jangan gunakan hover sebagai satu-satunya cara menemukan aksi.

### A. Kasir (layar utama)

- Indikator shift aktif (label, tanggal/jam mulai), atau tombol **Mulai Shift**.
- Kategori `Semua`, `Minuman`, `Makanan`; kolom pencarian nama menu.
- Kartu/tombol besar untuk menu, dengan nama dan harga; sepenuhnya bisa diklik, disentuh, dan dipilih melalui keyboard.
- Di HP: katalog berada di bagian atas dan ringkasan/pembayaran mudah dijangkau, tanpa membuat menu tak dapat diklik saat keyboard virtual terbuka.
- Di laptop/PC: katalog dan keranjang/pembayaran ditampilkan berdampingan jika lebar cukup; katalog tetap bisa discroll tanpa menghilangkan informasi total.
- Keranjang: nama item, harga satuan, kuantitas `−/+`, subtotal item, dan hapus item.
- Total belanja yang selalu terlihat.
- Input angka **Uang Diterima**; di Android memunculkan keypad numerik, sedangkan di laptop/PC menerima ketikan angka dan operasi hapus dengan keyboard; tombol cepat Rp20.000/Rp50.000/Rp100.000 (tidak menghalangi input bebas).
- Kembalian dihitung langsung; jika kurang tampilkan **Kurang RpX** (bukan kembalian negatif).
- Tombol **Simpan Transaksi** dengan loading/disabled sewaktu penyimpanan untuk menghindari duplikasi.
- Tombol **Kosongkan Keranjang** dengan konfirmasi ketika ada pesanan; jangan menghapus catatan shift.
- Urutan fokus keyboard logis (pencarian → katalog → keranjang → pembayaran → simpan); status dan kesalahan diberi teks, bukan hanya perubahan warna.
- Tombol penting berukuran area sentuh/klik sekurang-kurangnya **44 × 44 CSS px**, dengan label yang dapat dibaca pembaca layar.

### B. Catatan Shift

- Header informasi shift, jumlah transaksi berhasil, total penjualan shift, dan status `Belum disalin` / `Sudah disalin`.
- Tampilan buku **dua kolom**: `Nama Makanan/Minuman` dan `Harga` (harga berupa subtotal yang sudah dikalikan kuantitas).
- Produk yang sama dari **seluruh transaksi dalam satu shift** digabung berdasarkan **identitas menu + harga satuan saat transaksi**; diurutkan alfabetis agar mudah disalin.
- Format nama contoh: `Es Teh (3x)`; kolom harga `12.000`.
- Baris paling bawah `TOTAL` berisi jumlah seluruh transaksi valid pada shift.
- Tampilan **Rincian Transaksi** terpisah/di-expand untuk koreksi, tanpa menambah kolom buku.
- Tombol **Akhiri Shift**, **Tandai Sudah Disalin**, dan **Salin Catatan** (ke clipboard) yang menyalin teks dua kolom dan total. Tombol salin tidak menandai sudah disalin secara otomatis.
- Bila shift belum ditutup, catatan bisa dilihat namun status *Sudah disalin* baru tersedia setelah shift ditutup.

### C. Riwayat Shift

- Daftar sesi berdasarkan waktu mulai, label shift, total, dan status sudah/belum disalin.
- Bisa melihat ulang catatan shift yang ditutup.
- Catatan yang berstatus *Sudah disalin* bersifat hanya-baca pada MVP; pembetulan memerlukan tindakan eksplisit **Batalkan tanda disalin** disertai konfirmasi, lalu tandai lagi setelah buku diperbaiki.

### D. Kelola Menu dan Cadangan

- Daftar 37 produk awal, edit nama/harga/kategori, aktif/nonaktif, tambah produk.
- Perubahan harga **hanya berlaku untuk transaksi berikutnya**, tidak mengubah catatan lama.
- Cadangkan data sebagai file JSON di perangkat; pulihkan dari JSON dengan validasi dan konfirmasi karena bisa mengganti data lokal.
- Petunjuk bahwa menghapus data browser/perangkat dapat menghilangkan catatan yang belum dicadangkan.
- Panduan penggunaan lintas perangkat: **data di Android dan laptop/PC berbeda** sampai dilakukan backup dan restore secara manual. Tidak ada sinkronisasi otomatis atau pergantian perangkat tanpa pemindahan data. Sebelum impor, buat backup dari perangkat tujuan agar tidak kehilangan catatan.

### E. Navigasi dan perilaku perangkat

- Tab utama `Kasir`, `Catatan Shift`, `Riwayat Shift`, dan `Pengaturan/Kelola Menu` terlihat jelas pada HP maupun desktop.
- **Android:** navigasi ringkas di area yang mudah dijangkau; tidak bergantung pada hover atau klik kanan; modals/drawers tetap dapat ditutup lewat tombol yang jelas.
- **Laptop/PC:** navigasi dapat memakai sidebar atau tab horizontal; tersedia status fokus yang terlihat; seluruh tombol penting dapat diakses dengan `Tab` dan diaktifkan dengan `Enter`/`Space` sesuai semantik kontrol.
- Konfirmasi simpan, hapus, void, dan akhir shift tetap konsisten di semua ukuran; pembesaran/pengecilan jendela atau rotasi perangkat **tidak mereset keranjang maupun shift aktif**.
- Shortcut mempercepat kerja seperti `/` untuk fokus pencarian atau `Esc` untuk menutup dialog **boleh ditambahkan** jika tidak bertabrakan dengan pengisian nominal; fitur inti tidak bergantung pada shortcut.
- Tampilan PWA di Android dan desktop boleh berbeda pada tata letak, tetapi perhitungan, validasi, format catatan, dan perilaku penyimpanan harus identik.

## 6. Aturan bisnis dan validasi

| ID | Aturan |
|---|---|
| BR-01 | Produk dalam keranjang memiliki kuantitas bilangan bulat ≥ 1; harga dalam **integer rupiah**, bukan float. |
| BR-02 | Tidak bisa menyimpan transaksi tanpa shift aktif atau ketika keranjang kosong. |
| BR-03 | `total = Σ(qty × unitPriceSnapshot)`; `kembalian = uangDiterima − total` jika pembayaran cukup. |
| BR-04 | Jika uang diterima kosong/kurang/negatif/tidak valid, tombol simpan tidak aktif, dan jelaskan kekurangannya. |
| BR-05 | Saat menyimpan, buat snapshot nama & harga produk; transaksi disimpan sekali (anti-double-tap). |
| BR-06 | Mengedit harga katalog tidak mengubah `unitPriceSnapshot` pada transaksi sebelumnya. |
| BR-07 | Dalam catatan shift, agregasikan `qty` menurut `(productId, nameSnapshot, unitPriceSnapshot)` sehingga harga berbeda tidak tercampur. |
| BR-08 | Jika ada **dua harga satuan berbeda** untuk nama produk yang sama pada suatu shift, tambahkan penanda pada nama, misalnya `Es Teh (3x @4.000)`, agar mudah dibedakan dalam dua kolom. |
| BR-09 | Transaksi yang dibatalkan (`void`) tidak masuk total maupun catatan; pembatalan hanya boleh sebelum shift ditandai Sudah disalin, dengan konfirmasi. |
| BR-10 | Satu shift aktif per perangkat; setelah Akhiri Shift, tidak bisa menambahkan transaksi ke sesi tersebut. |
| BR-11 | Waktu transaksi disimpan ISO timestamp; pemilihan/label tanggal ditampilkan di **Asia/Jakarta**. Shift yang melewati tengah malam tetap satu sesi berdasarkan `shiftId`. |
| BR-12 | Status *Sudah disalin* ditetapkan manual oleh pengguna setelah pindah ke buku; menyalin ke clipboard tidak mengubah status. |
| BR-13 | Tanpa koneksi internet: tidak boleh ada ketergantungan runtime pada API/cloud/CDN untuk proses inti setelah cache PWA siap. |
| BR-14 | Semua angka harga dan total yang ditampilkan menggunakan format rupiah Indonesia; pada kolom buku cukup `4.000`, `12.000`, dst. |
| BR-15 | Semua alur transaksi dan shift harus dapat dioperasikan dengan sentuhan di Android serta mouse/keyboard di laptop/PC; perubahan layout tidak mengubah total maupun data. |
| BR-16 | Database IndexedDB bersifat **lokal per browser dan perangkat**; jangan menampilkan status palsu seolah-olah transaksi di Android otomatis muncul di laptop/PC. |
| BR-17 | Restore lintas perangkat merupakan tindakan manual yang dapat **mengganti seluruh data pada perangkat tujuan**; selalu tampilkan konfirmasi dan anjuran backup sebelum menimpa. Jangan mengizinkan restore saat shift aktif tanpa langkah penanganan shift yang jelas. |

## 7. Contoh dan format buku dua kolom

**Contoh satu transaksi:** 3 Es Teh × Rp4.000, 2 Kopi Cangkir × Rp5.000, 1 Mie + Telur × Rp9.000.

- Total = Rp12.000 + Rp10.000 + Rp9.000 = **Rp31.000**.
- Uang diterima = **Rp50.000**.
- Kembalian = **Rp19.000**.

Catatan shift (misalnya belum ada transaksi lain):

| Nama Makanan/Minuman | Harga |
|---|---:|
| Es Teh (3x) | 12.000 |
| Kopi Cangkir (2x) | 10.000 |
| Mie + Telur (1x) | 9.000 |
| **TOTAL** | **31.000** |

Jika transaksi berikutnya menambahkan `Es Teh (2x)` di shift yang sama, baris catatan berubah menjadi **`Es Teh (5x)` — `20.000`**. Transaksi asli tetap tersimpan terpisah untuk pemeriksaan.

## 8. Katalog awal (transkripsi foto)

**Sumber:** foto daftar harga warkop dari pengguna. Terdapat **36 baris sumber**; 1 baris teh dipisah menjadi 2 pilihan, sehingga ada **37 produk** (35 minuman, 2 makanan) di aplikasi.

| No. | ID produk | Nama menu | Kategori | Harga satuan |
|---:|---|---|---|---:|
| 1 | `air-mineral` | Air Mineral | Minuman | Rp4.000 |
| 2 | `teh-hangat` | Teh Hangat | Minuman | Rp4.000 |
| 3 | `es-teh` | Es Teh | Minuman | Rp4.000 |
| 4 | `kopi-cangkir` | Kopi Cangkir | Minuman | Rp5.000 |
| 5 | `kopi-gelas` | Kopi Gelas | Minuman | Rp6.000 |
| 6 | `kopi-susu-cangkir` | Kopi Susu Cangkir | Minuman | Rp6.000 |
| 7 | `kopi-susu-gelas` | Kopi Susu Gelas | Minuman | Rp7.000 |
| 8 | `jahe-geprek` | Jahe Geprek | Minuman | Rp5.000 |
| 9 | `kapal-api` | Kapal Api | Minuman | Rp5.000 |
| 10 | `white-coffee` | White Coffee | Minuman | Rp5.000 |
| 11 | `tora-moka` | Tora Moka | Minuman | Rp5.000 |
| 12 | `tora-susu` | Tora Susu | Minuman | Rp5.000 |
| 13 | `extra-joss` | Extra Joss | Minuman | Rp5.000 |
| 14 | `kukubima` | Kukubima | Minuman | Rp5.000 |
| 15 | `hemaviton-jreng` | Hemaviton Jreng | Minuman | Rp5.000 |
| 16 | `pop-ice` | Pop Ice | Minuman | Rp5.000 |
| 17 | `nutrisari` | Nutrisari | Minuman | Rp5.000 |
| 18 | `es-sirup` | Es Sirup | Minuman | Rp5.000 |
| 19 | `mie-instan` | Mie Instan | Makanan | Rp6.000 |
| 20 | `kopi-jahe-cangkir` | Kopi Jahe Cangkir | Minuman | Rp6.000 |
| 21 | `kopi-jahe-gelas` | Kopi Jahe Gelas | Minuman | Rp7.000 |
| 22 | `susu-jahe` | Susu Jahe | Minuman | Rp6.000 |
| 23 | `good-day` | Good Day | Minuman | Rp6.000 |
| 24 | `sido-muncul` | Sido Muncul | Minuman | Rp6.000 |
| 25 | `indocafe` | Indocafe | Minuman | Rp6.000 |
| 26 | `tora-cafe` | Tora Cafe | Minuman | Rp6.000 |
| 27 | `energen` | Energen | Minuman | Rp6.000 |
| 28 | `chocolatos` | Chocolatos | Minuman | Rp6.000 |
| 29 | `drink-beng-beng` | Drink Beng-Beng | Minuman | Rp6.000 |
| 30 | `milo` | Milo | Minuman | Rp6.000 |
| 31 | `abc-klepon` | ABC Klepon | Minuman | Rp6.000 |
| 32 | `bonteh` | Bonteh | Minuman | Rp6.000 |
| 33 | `jhosua` | Jhosua | Minuman | Rp7.000 |
| 34 | `kukubima-susu` | Kukubima Susu | Minuman | Rp7.000 |
| 35 | `jreng-susu` | Jreng Susu | Minuman | Rp7.000 |
| 36 | `soda-gembira` | Soda Gembira | Minuman | Rp12.000 |
| 37 | `mie-telur` | Mie + Telur | Makanan | Rp9.000 |

> **Pemeriksaan sebelum rilis:** pastikan ejaan menu `Bonteh`, `Jhosua`, `Sido Muncul`, dan menu lainnya sudah sesuai tulisan/penamaan di warkop. Daftar ini dapat diperbaiki lewat layar Kelola Menu, tanpa mengubah histori transaksi.

## 9. Struktur data (logis)

- `Product`: `id`, `name`, `category` (`Minuman`/`Makanan`), `priceRupiah` (integer), `isActive`, `createdAt`, `updatedAt`.
- `Shift`: `id`, `label`, `startedAt`, `endedAt | null`, `status` (`OPEN`/`CLOSED`), `copyStatus` (`NOT_COPIED`/`COPIED`), `copiedAt | null`.
- `Transaction`: `id`, `shiftId`, `createdAt`, `status` (`COMPLETED`/`VOIDED`), `items[]`, `totalRupiah`, `cashReceivedRupiah`, `changeRupiah`, `voidedAt | null`.
- `TransactionItem`: `productId`, `productNameSnapshot`, `unitPriceSnapshotRupiah`, `quantity`, `subtotalRupiah`.
- `AppMeta`: `schemaVersion`, `initializedAt`, `lastBackupAt | null`.

**Penyimpanan:** IndexedDB (misalnya Dexie), bukan LocalStorage untuk catatan utama, pada **masing-masing browser/perangkat**. Data produk, shift, dan transaksi disimpan lokal dalam satu database. Perubahan yang melibatkan transaksi/status harus melalui transaksi database agar tetap konsisten. `TOTAL` shift dihitung dari transaksi `COMPLETED`, bukan disimpan sebagai sumber kebenaran terpisah.

### Aturan pencadangan

- Backup JSON mencakup produk, shift, transaksi, dan versi skema.
- Restore memvalidasi format, keunikan ID, referensi shift, dan nilai moneter; simulasikan pengecekan sebelum mengganti data.
- Tampilkan konfirmasi: restore **mengganti seluruh data lokal**. Buat backup manual dulu bila data existing berharga.
- Tidak ada janji sinkronisasi atau backup otomatis cloud.
- Backup dari Android boleh dipindahkan sebagai file JSON ke laptop/PC (atau sebaliknya) dan di-restore secara manual, **tetapi restore bukan merge/sinkronisasi**. Tampilkan asal/waktu backup serta konsekuensi penggantian data; untuk MVP pergantian perangkat sebaiknya dilakukan antarshift, bukan saat shift berjalan.

## 10. Persyaratan nonfungsional

- **Offline-first:** aplikasi dapat dipasang sebagai PWA; aset UI dapat dibuka offline setelah kunjungan/instalasi awal saat online dan cache sukses. Pastikan service worker tidak membatalkan penyimpanan IndexedDB.
- **Responsif lintas perangkat (prioritas setara):** nyaman pada Android 320 CSS px hingga laptop/desktop lebar; menu dapat ditemukan, keranjang dapat diedit, uang diterima bisa diinput, dan catatan dua kolom dapat dibaca tanpa scroll horizontal wajib pada viewport target.
- **Pointer & keyboard:** semua aksi utama mendukung touch, mouse/trackpad dan navigasi keyboard; gunakan fokus yang terlihat dan label input/aksi yang jelas.
- **Tata letak:** HP menggunakan alur satu kolom dan pembayaran mudah dijangkau; desktop lebar menggunakan katalog dan panel keranjang berdampingan. Perubahan ukuran jendela tidak boleh membuang input/keranjang.
- **Perangkat & instalasi:** uji PWA pada Android (Chrome) dan laptop/PC (Chrome/Edge); kemampuan pemasangan bergantung pada browser, tetapi web app harus tetap bisa digunakan lewat tab browser.
- **Akses cepat:** target sentuh tombol utama minimal 44×44 CSS px; teks jumlah/total besar, kontras jelas.
- **Reliabilitas:** transaksi tak boleh hilang saat pindah tab/refresh sesudah notifikasi *berhasil disimpan*; cegah simpan ganda.
- **Privasi:** data tetap di perangkat masing-masing, tanpa nama pelanggan, tanpa akun, tanpa pengiriman data transaksi ke server. Data antarperangkat tidak dibagikan secara otomatis.
- **Perlindungan data:** tampilkan peringatan untuk backup rutin; mode privat/incognito dan pembersihan cache/data situs dapat menghapus database.
- **Batasan:** bila HP hilang atau browser menghapus data sebelum backup, catatan lokal mungkin tidak bisa dipulihkan.

## 11. Kriteria penerimaan (acceptance criteria)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| AC-01 | 3 Es Teh, 2 Kopi Cangkir, 1 Mie + Telur | Total Rp31.000. |
| AC-02 | AC-01 dibayar Rp50.000 | Kembalian Rp19.000; bisa disimpan. |
| AC-03 | AC-01 dibayar Rp20.000 | Pesan kurang Rp11.000; simpan dinonaktifkan. |
| AC-04 | Belum Mulai Shift lalu tekan Simpan | Transaksi tidak disimpan, tampilkan alasan. |
| AC-05 | Dua transaksi di shift yang sama: Es Teh 3x dan 2x | Satu baris `Es Teh (5x)` — `20.000`. |
| AC-06 | Transaksi tersimpan lalu refresh dan restart browser | Transaksi dan catatan shift tetap tersedia. |
| AC-07 | Ubah harga Kopi Cangkir dari 5.000 ke 6.000 | Transaksi lama tetap 5.000/unit; transaksi baru 6.000/unit. |
| AC-08 | Simpan ditekan dua kali cepat | Tepat satu transaksi baru. |
| AC-09 | Tutup shift lalu buka shift berikutnya | Transaksi tidak tercampur; sesi lama bisa dilihat. |
| AC-10 | Salin Catatan ke clipboard | Teks tetap dua kolom; status *Belum disalin* belum berubah. |
| AC-11 | Tandai Sudah Disalin setelah shift ditutup | Badge status berubah, data tetap tersimpan. |
| AC-12 | Ekspor backup JSON dan restore pada database uji | Produk, shift, transaksi, dan total hasil perhitungan kembali sama. |
| AC-13 | Offline setelah aplikasi siap-cache | Kasir, simpan, hitung kembalian, catatan, riwayat berfungsi. |
| AC-14 | Menu awal dimuat | 37 tombol produk; semua harga sesuai tabel di atas. |
| AC-15 | Shift mulai 23:30, transaksi 00:15 | Kedua transaksi masuk shift yang sama. |
| AC-16 | Batalkan transaksi yang salah sebelum buku disalin | Tidak dihitung di catatan atau total shift; audit void tetap tercatat. |
| AC-17 | Kasir dibuka di HP Android viewport 360 × 800; pengguna mengetuk 3 produk, menambah/mengurangi qty, memasukkan uang | Seluruh aksi bisa dilakukan tanpa hover; total dan kembalian terlihat, dan tombol utama mudah disentuh. |
| AC-18 | Kasir dibuka pada laptop/PC viewport 1366 × 768; pengguna memakai mouse dan keyboard | Katalog dan keranjang muncul berdampingan; cari menu, tambah item, isi uang, dan simpan transaksi berfungsi. |
| AC-19 | Jendela desktop dipersempit ke 768 lalu 375 CSS px, atau Android diputar orientasinya | Layout menyesuaikan tanpa keranjang hilang, kuantitas berubah, atau shift ter-reset. |
| AC-20 | Pengguna melakukan seluruh alur kasir dengan Tab dan Enter/Space di desktop | Fokus dapat terlihat; kontrol dan pesan validasi dapat digunakan tanpa mouse. |
| AC-21 | Buka aplikasi di Android dan laptop/PC tanpa proses transfer backup | Catatan tidak diklaim sinkron; UI menjelaskan penyimpanan terpisah per perangkat. |
| AC-22 | Backup dari Android diimpor di laptop/PC yang sudah memiliki data | Sistem memvalidasi file, memberi peringatan penggantian data, menawarkan backup data tujuan, dan hanya melanjutkan setelah konfirmasi pengguna. |

## 12. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Browser/HP menghapus data lokal | Backup JSON manual, peringatan di UI, lakukan uji restore. |
| Berpindah Android ke laptop/PC mengira data otomatis sama | Beri pemberitahuan data hanya tersimpan pada perangkat/browser yang dipakai; ekspor/impor manual di antara shift. |
| Restore data dari perangkat lain menimpa catatan tujuan | Konfirmasi eksplisit, backup data tujuan dahulu, validasi file, dan larang restore tanpa penyelesaian shift aktif. |
| Layout desktop/HP berbeda menimbulkan salah tekan | Katalog dan keranjang konsisten, target kontrol besar, uji breakpoint dan aksesibilitas keyboard. |
| Salah tekan produk/kuantitas | Keranjang dapat diedit sebelum pembayaran, transaksi dapat di-void dengan konfirmasi. |
| Menekan simpan berkali-kali | Tombol dinonaktifkan saat proses, gunakan ID transaksi unik dan atomic commit. |
| Harga berubah setelah transaksi | Simpan snapshot harga dan nama di tiap transaction item. |
| Shift melewati tengah malam | Gunakan `shiftId`, jangan sekadar mengelompokkan tanggal kalender. |
| Catatan sudah dipindahkan ke buku tetapi diedit digital | Kunci status sudah disalin; pembukaan kembali harus jelas dan terkonfirmasi. |

## 13. Definisi selesai (MVP)

MVP dianggap selesai ketika **semua AC-01 s.d. AC-22 lulus**, alur pembayaran dapat dilakukan offline **di HP Android dan laptop/PC**, 37 menu tersedia dengan harga benar, catatan dua kolom bisa disalin secara manual, dan backup/restore pernah diuji nyata termasuk skenario pemindahan file antarperangkat. Tidak perlu backend atau akun untuk rilis pertama.

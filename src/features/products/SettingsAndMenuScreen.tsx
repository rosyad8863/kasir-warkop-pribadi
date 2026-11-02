import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Edit3,
  Plus,
  ShieldAlert,
  Smartphone,
  Upload,
} from 'lucide-react';
import type {
  AppMeta,
  Product,
  ProductCategory,
  Shift,
} from '../../types';
import {
  formatJakartaDateTime,
  formatRupiah,
  parseRupiahInput,
} from '../../domain/money';
import {
   validateBackupJson,
  type BackupValidationResult,
} from '../../domain/validation';
import {
  exportDatabaseBackup,
  restoreDatabaseFromBackup,
  saveProduct,
  toggleProductActive,
} from '../../db/repositories';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface SettingsAndMenuScreenProps {
  products: Product[];
  activeShift: Shift | undefined;
  appMeta: AppMeta | undefined;
}

export const SettingsAndMenuScreen: React.FC<SettingsAndMenuScreenProps> = ({
  products,
  activeShift,
  appMeta,
}) => {
  // Menu Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<ProductCategory>('Minuman');
  const [priceInput, setPriceInput] = useState('');
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuSuccess, setMenuSuccess] = useState<string | null>(null);
  const [confirmZeroPrice, setConfirmZeroPrice] = useState(false);

  // Backup & Restore State
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] =
    useState<BackupValidationResult | null>(null);

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNameInput(product.name);
    setCategoryInput(product.category);
    setPriceInput(String(product.priceRupiah));
    setMenuError(null);
    setMenuSuccess(null);
  };

  const resetMenuForm = () => {
    setEditingProduct(null);
    setNameInput('');
    setCategoryInput('Minuman');
    setPriceInput('');
    setMenuError(null);
  };

  const executeSaveProduct = async (parsedPrice: number) => {
    setMenuError(null);
    setMenuSuccess(null);
    try {
      const saved = await saveProduct({
        id: editingProduct?.id,
        name: nameInput,
        category: categoryInput,
        priceRupiah: parsedPrice,
      });
      setMenuSuccess(
        editingProduct
          ? `Menu "${saved.name}" berhasil diperbarui (${formatRupiah(saved.priceRupiah)}).`
          : `Menu baru "${saved.name}" berhasil ditambahkan.`
      );
      resetMenuForm();
      setConfirmZeroPrice(false);
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'Gagal menyimpan menu.');
    }
  };

  const handleMenuFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError(null);
    setMenuSuccess(null);

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setMenuError('Nama menu wajib diisi.');
      return;
    }

    const parsedPrice = parseRupiahInput(priceInput);
    if (parsedPrice === null) {
      setMenuError('Harga harus berupa angka bulat Rupiah (contoh: 5000).');
      return;
    }

    if (parsedPrice === 0) {
      setConfirmZeroPrice(true);
      return;
    }

    await executeSaveProduct(parsedPrice);
  };

  const handleToggleActive = async (product: Product) => {
    setMenuError(null);
    try {
      await toggleProductActive(product.id, !product.isActive);
    } catch (err) {
      setMenuError(
        err instanceof Error ? err.message : 'Gagal mengubah status menu.'
      );
    }
  };

  const handleExportBackup = async () => {
    setBackupError(null);
    setBackupMessage(null);
    try {
      const payload = await exportDatabaseBackup();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const datePart = payload.exportedAt.slice(0, 10);
      a.href = url;
      a.download = `backup-kasir-warkop-${datePart}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage('Berkas backup JSON berhasil diunduh ke perangkat ini.');
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : 'Gagal mengekspor backup.'
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupError(null);
    setBackupMessage(null);
    setPendingRestore(null);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const validation = validateBackupJson(text);
      if (!validation.valid) {
        setBackupError(validation.errors.join(' '));
      } else {
        setPendingRestore(validation);
      }
    } catch {
      setBackupError('Gagal membaca berkas JSON.');
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore?.payload) return;
    setBackupError(null);
    setBackupMessage(null);
    try {
      await restoreDatabaseFromBackup(pendingRestore.payload);
      setPendingRestore(null);
      setBackupMessage(
        'Data berhasil dipulihkan (Restore) dari berkas backup JSON.'
      );
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : 'Gagal memulihkan data.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Device-local & Privacy Notice (AC-21) */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
          <Smartphone className="h-5 w-5 text-amber-700 shrink-0" />
          <span>Penyimpanan Lokal Per Perangkat (Tanpa Sinkronisasi Otomatis)</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          Data katalog, shift, dan transaksi disimpan di dalam browser perangkat ini
          (IndexedDB) agar bekerja 100% offline. <strong>Data di HP Android dan
          laptop/PC tidak tersinkronisasi otomatis.</strong> Jika ingin memindahkan
          catatan antarperangkat atau mencegah kehilangan data akibat hapus cache/mode
          incognito, gunakan fitur <strong>Ekspor &amp; Impor Backup JSON</strong> di
          bawah.
        </p>
      </div>

      {/* SECTION 1: BACKUP & RESTORE */}
      <section
        aria-label="Cadangan dan Pemulihan Data"
        className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-stone-900">
              Cadangan &amp; Pemulihan Data (Backup JSON)
            </h2>
            <p className="text-xs text-stone-600">
              Backup terakhir:{' '}
              {appMeta?.lastBackupAt
                ? `${formatJakartaDateTime(appMeta.lastBackupAt)} WIB`
                : 'Belum pernah dicadangkan'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-300 hover:bg-stone-800"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor Backup JSON</span>
            </button>

            <label
              htmlFor="restore-json-input"
              className={`min-h-[44px] inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold ${
                activeShift
                  ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-200'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Pilih Berkas Restore JSON</span>
              <input
                id="restore-json-input"
                type="file"
                accept="application/json,.json"
                disabled={Boolean(activeShift)}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {activeShift && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-xs font-semibold text-amber-950">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              Restore dinonaktifkan selama <strong>Shift {activeShift.label}</strong> masih
              aktif. Akhiri shift aktif terlebih dahulu sebelum mengimpor data.
            </span>
          </div>
        )}

        {backupMessage && (
          <p
            role="status"
            className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900"
          >
            {backupMessage}
          </p>
        )}

        {backupError && (
          <p
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800"
          >
            {backupError}
          </p>
        )}

        {/* Restore Preview & Confirmation Box (AC-22) */}
        {pendingRestore?.summary && (
          <div className="rounded-2xl border-2 border-red-400 bg-red-50/90 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold text-red-950">
                  Konfirmasi Pemulihan Data (Menimpa Data Lokal)
                </h3>
                <p className="text-xs text-red-900 mt-1">
                  Tindakan ini akan <strong>mengganti seluruh data di perangkat ini</strong>{' '}
                  dengan isi berkas backup. Unduh backup perangkat ini terlebih dahulu jika
                  masih ada catatan penting.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 text-xs text-stone-800 space-y-1 border border-red-200">
              <div>
                <strong>Waktu Backup:</strong>{' '}
                {formatJakartaDateTime(pendingRestore.summary.exportedAt)} WIB
              </div>
              <div>
                <strong>Jumlah Menu:</strong> {pendingRestore.summary.productCount} produk
              </div>
              <div>
                <strong>Jumlah Shift:</strong> {pendingRestore.summary.shiftCount} shift
              </div>
              <div>
                <strong>Jumlah Transaksi:</strong>{' '}
                {pendingRestore.summary.transactionCount} transaksi
              </div>
              <div>
                <strong>Total Penjualan Tercatat:</strong>{' '}
                {formatRupiah(pendingRestore.summary.totalCompletedRevenueRupiah)}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
              >
                Backup Data Perangkat Ini Dulu
              </button>
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-700"
              >
                Ya, Timpa &amp; Pulihkan Sekarang
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: PRODUCT CATALOG MANAGEMENT */}
      <section
        aria-label="Kelola Katalog Menu"
        className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs space-y-5"
      >
        <div>
          <h2 className="text-base font-extrabold text-stone-900">
            Kelola Menu &amp; Harga ({products.length} menu)
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Perubahan nama atau harga hanya berlaku untuk transaksi berikutnya dan tidak
            mengubah histori transaksi lama.
          </p>
        </div>

        {/* Add / Edit Form */}
        <form
          onSubmit={handleMenuFormSubmit}
          className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              {editingProduct ? `Edit Menu: ${editingProduct.name}` : 'Tambah Menu Baru'}
            </h3>
            {editingProduct && (
              <button
                type="button"
                onClick={resetMenuForm}
                className="text-xs font-semibold text-stone-600 underline hover:text-stone-900"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label
                htmlFor="menu-name-input"
                className="block text-xs font-bold text-stone-700 mb-1"
              >
                Nama Menu
              </label>
              <input
                id="menu-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: Kopi Susu Gelas"
                className="min-h-[44px] w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="menu-category-select"
                className="block text-xs font-bold text-stone-700 mb-1"
              >
                Kategori
              </label>
              <select
                id="menu-category-select"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as ProductCategory)}
                className="min-h-[44px] w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="Minuman">Minuman</option>
                <option value="Makanan">Makanan</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="menu-price-input"
                className="block text-xs font-bold text-stone-700 mb-1"
              >
                Harga Satuan (Rp)
              </label>
              <div className="flex gap-2">
                <input
                  id="menu-price-input"
                  type="text"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="5000"
                  className="min-h-[44px] w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-900"
                />
                <button
                  type="submit"
                  className="min-h-[44px] shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-extrabold text-white hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>{editingProduct ? 'Simpan' : 'Tambah'}</span>
                </button>
              </div>
            </div>
          </div>

          {menuError && (
            <p role="alert" className="text-xs font-bold text-red-700">
              {menuError}
            </p>
          )}
          {menuSuccess && (
            <p role="status" className="text-xs font-bold text-emerald-700">
              {menuSuccess}
            </p>
          )}
        </form>

        {/* Product List Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                <th className="py-2.5 px-3 font-bold">Nama Menu</th>
                <th className="py-2.5 px-3 font-bold">Kategori</th>
                <th className="py-2.5 px-3 font-bold text-right">Harga</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
                <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={!product.isActive ? 'bg-stone-50 opacity-60' : ''}
                >
                  <td className="py-2.5 px-3 font-bold text-stone-900">
                    {product.name}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-stone-600">
                    {product.category}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-stone-900 tabular-nums">
                    {formatRupiah(product.priceRupiah)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        product.isActive
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {product.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditProduct(product)}
                        className="min-h-[44px] inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(product)}
                        className="min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                      >
                        {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={confirmZeroPrice}
        title="Simpan Menu dengan Harga Rp0?"
        description="Harga Rp0 (gratis) tidak umum untuk menu warkop. Apakah Anda yakin ingin menyimpan harga Rp0?"
        confirmLabel="Ya, Simpan Rp0"
        onConfirm={() => executeSaveProduct(0)}
        onCancel={() => setConfirmZeroPrice(false)}
      />
    </div>
  );
};

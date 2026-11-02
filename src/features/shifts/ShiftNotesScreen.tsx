import React, { useMemo, useState } from 'react';
import {
  BookCheck,
  Check,
  ClipboardCopy,
  Receipt,
  Square,
  Trash2,
  Unlock,
} from 'lucide-react';
import type { Shift, Transaction } from '../../types';
import {
  buildShiftLedger,
  formatLedgerTwoColumnText,
  formatSingleOrderTwoColumnText,
} from '../../domain/ledger';
import {
  formatJakartaDateTime,
  formatJakartaTimeOnly,
  formatRupiah,
  formatRupiahNumber,
} from '../../domain/money';
import {
  closeActiveShift,
  markShiftCopiedStatus,
  voidTransaction,
} from '../../db/repositories';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface ShiftNotesCardProps {
  shift: Shift;
  transactions: Transaction[];
}

export const ShiftNotesCard: React.FC<ShiftNotesCardProps> = ({
  shift,
  transactions,
}) => {
  const [copiedClipboard, setCopiedClipboard] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [confirmEndShift, setConfirmEndShift] = useState(false);
  const [confirmUnmarkCopied, setConfirmUnmarkCopied] = useState(false);
  const [txToVoid, setTxToVoid] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ledger = useMemo(() => buildShiftLedger(transactions), [transactions]);

  // Sort chronological (#1, #2, ...) for clear order numbering
  const chronologicalTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      ),
    [transactions]
  );

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleCopyClipboard = async () => {
    setError(null);
    const text = formatLedgerTwoColumnText(ledger);
    try {
      await copyTextToClipboard(text);
      setCopiedClipboard(true);
      setTimeout(() => setCopiedClipboard(false), 2500);
    } catch {
      setError('Gagal menyalin ke clipboard.');
    }
  };

  const handleCopySingleOrder = async (tx: Transaction, orderNumber: number) => {
    setError(null);
    const text = formatSingleOrderTwoColumnText(tx, orderNumber);
    try {
      await copyTextToClipboard(text);
      setCopiedOrderId(tx.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch {
      setError('Gagal menyalin pesanan ke clipboard.');
    }
  };

  const handleEndShift = async () => {
    setError(null);
    try {
      await closeActiveShift(shift.id);
      setConfirmEndShift(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menutup shift.');
    }
  };

  const handleMarkCopied = async (copied: boolean) => {
    setError(null);
    try {
      await markShiftCopiedStatus(shift.id, copied);
      setConfirmUnmarkCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status salin.');
    }
  };

  const handleVoidConfirm = async () => {
    if (!txToVoid) return;
    setError(null);
    try {
      await voidTransaction(txToVoid.id);
      setTxToVoid(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membatalkan transaksi.');
    }
  };

  const isClosed = shift.status === 'CLOSED';
  const isCopied = shift.copyStatus === 'COPIED';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs space-y-6">
      {/* Shift Metadata Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold text-stone-900">
              Catatan Shift {shift.label}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isClosed
                  ? 'bg-stone-200 text-stone-800'
                  : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {isClosed ? 'Selesai / Ditutup' : 'Masih Aktif'}
            </span>
            <span
              data-testid="shift-copy-status-badge"
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isCopied
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isCopied ? 'Sudah disalin' : 'Belum disalin'}
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Mulai: {formatJakartaDateTime(shift.startedAt)} WIB
            {shift.endedAt ? ` · Selesai: ${formatJakartaDateTime(shift.endedAt)} WIB` : ''}
          </p>
          <p className="text-xs font-semibold text-stone-700 mt-1">
            Pesanan Berhasil: {ledger.completedTransactionCount}
            {ledger.voidedTransactionCount > 0
              ? ` · Dibatalkan (Void): ${ledger.voidedTransactionCount}`
              : ''}{' '}
            · Total Shift: <strong>{formatRupiah(ledger.totalRupiah)}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyClipboard}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-800 hover:bg-stone-200"
          >
            {copiedClipboard ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="h-4 w-4" />
                <span>Salin Catatan</span>
              </>
            )}
          </button>

          {!isClosed && (
            <button
              type="button"
              onClick={() => setConfirmEndShift(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-red-700"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Akhiri Shift</span>
            </button>
          )}

          {isClosed && !isCopied && (
            <button
              type="button"
              onClick={() => handleMarkCopied(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700"
            >
              <BookCheck className="h-4 w-4" />
              <span>Tandai Sudah Disalin</span>
            </button>
          )}

          {isClosed && isCopied && (
            <button
              type="button"
              onClick={() => setConfirmUnmarkCopied(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-950 hover:bg-amber-100"
            >
              <Unlock className="h-4 w-4" />
              <span>Batalkan Tanda Disalin</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      {/* SECTION 1: SEPARATE 2-COLUMN TABLE FOR EACH SAVED ORDER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-700" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-800">
              Tabel Per Pesanan Tersimpan ({chronologicalTransactions.length} Pesanan)
            </h3>
          </div>
          <span className="text-xs text-stone-500">Tabel Terpisah Tiap Transaksi</span>
        </div>

        {chronologicalTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 py-8 px-4 text-center text-sm text-stone-500">
            Belum ada pesanan yang disimpan pada shift ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {chronologicalTransactions.map((tx, index) => {
              const orderNumber = index + 1;
              const isVoided = tx.status === 'VOIDED';
              const isThisCopied = copiedOrderId === tx.id;

              return (
                <div
                  key={tx.id}
                  data-testid={`order-table-card-${orderNumber}`}
                  className={`rounded-2xl border-2 overflow-hidden flex flex-col justify-between ${
                    isVoided
                      ? 'border-stone-300 bg-stone-100 opacity-75'
                      : 'border-stone-800 bg-white shadow-xs'
                  }`}
                >
                  <div>
                    {/* Order Table Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900 px-4 py-2.5 text-white">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-amber-500 px-2 py-0.5 text-xs font-black text-stone-950">
                          Pesanan #{orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-stone-300">
                          {formatJakartaTimeOnly(tx.createdAt)} WIB
                        </span>
                        {isVoided && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            DIBATALKAN (VOID)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopySingleOrder(tx, orderNumber)}
                          aria-label={`Salin Pesanan #${orderNumber}`}
                          className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs font-bold text-stone-200 hover:bg-stone-700"
                        >
                          {isThisCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>

                        {!isVoided && !isCopied && (
                          <button
                            type="button"
                            onClick={() => setTxToVoid(tx)}
                            aria-label={`Batalkan Pesanan #${orderNumber}`}
                            className="min-h-[36px] inline-flex items-center gap-1 rounded-lg bg-red-600/90 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Void</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Separate 2-Column Table for This Order */}
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-stone-300 bg-stone-100 text-stone-700">
                          <th className="py-2 px-3.5 text-xs font-bold">
                            Nama Makanan/Minuman
                          </th>
                          <th className="py-2 px-3.5 text-right text-xs font-bold">
                            Harga
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {tx.items.map((item, idx) => (
                          <tr
                            key={`${tx.id}-${idx}`}
                            className={isVoided ? 'line-through text-stone-400' : ''}
                          >
                            <td className="py-2 px-3.5 text-sm font-bold text-stone-900">
                              {item.productNameSnapshot} ({item.quantity}x)
                            </td>
                            <td className="py-2 px-3.5 text-right text-sm font-extrabold text-stone-900 tabular-nums">
                              {formatRupiahNumber(item.subtotalRupiah)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-stone-800 bg-amber-50">
                          <th className="py-2.5 px-3.5 text-xs sm:text-sm font-extrabold text-stone-950">
                            TOTAL PESANAN #{orderNumber}
                          </th>
                          <td className="py-2.5 px-3.5 text-right text-sm sm:text-base font-extrabold text-stone-950 tabular-nums">
                            {formatRupiahNumber(tx.totalRupiah)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Cash & Change Footer */}
                  <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-600">
                    <span>Tunai: {formatRupiah(tx.cashReceivedRupiah)}</span>
                    <span>Kembalian: {formatRupiah(tx.changeRupiah)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: COMBINED 2-COLUMN SHIFT SUMMARY TABLE */}
      <div className="border-t border-stone-200 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-700">
            Rekap Gabungan Seluruh Shift (Buku 2 Kolom)
          </h3>
          <span className="text-xs text-stone-500">Urut Alfabetis A–Z</span>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-stone-800">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-stone-900 text-white">
                <th className="py-3 px-4 text-xs sm:text-sm font-bold">
                  Nama Makanan/Minuman
                </th>
                <th className="py-3 px-4 text-right text-xs sm:text-sm font-bold">
                  Harga
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-amber-50/30">
              {ledger.rows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 px-4 text-center text-sm text-stone-500">
                    Belum ada transaksi aktif pada shift ini.
                  </td>
                </tr>
              ) : (
                ledger.rows.map((row) => (
                  <tr key={row.key} className="hover:bg-amber-100/40">
                    <td className="py-2.5 px-4 text-sm sm:text-base font-bold text-stone-900">
                      {row.displayName}
                    </td>
                    <td className="py-2.5 px-4 text-right text-sm sm:text-base font-extrabold text-stone-900 tabular-nums">
                      {formatRupiahNumber(row.amountRupiah)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-800 bg-amber-100/90">
                <th className="py-3 px-4 text-sm sm:text-base font-extrabold text-stone-950">
                  TOTAL
                </th>
                <td
                  data-testid="ledger-total-cell"
                  className="py-3 px-4 text-right text-base sm:text-lg font-extrabold text-stone-950 tabular-nums"
                >
                  {formatRupiahNumber(ledger.totalRupiah)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmEndShift}
        title={`Akhiri Shift ${shift.label}?`}
        description="Setelah shift diakhiri, transaksi baru tidak bisa ditambahkan ke shift ini. Anda dapat menyalin catatan ke buku fisik dan menandai Sudah Disalin."
        confirmLabel="Ya, Akhiri Shift"
        variant="danger"
        onConfirm={handleEndShift}
        onCancel={() => setConfirmEndShift(false)}
      />

      <ConfirmDialog
        open={confirmUnmarkCopied}
        title="Batalkan Tanda Sudah Disalin?"
        description="Membuka kembali kunci catatan memungkinkan pembatalan (void) transaksi. Pastikan Anda juga memperbarui catatan di buku fisik setelah koreksi selesai."
        confirmLabel="Ya, Buka Kunci"
        variant="danger"
        onConfirm={() => handleMarkCopied(false)}
        onCancel={() => setConfirmUnmarkCopied(false)}
      />

      <ConfirmDialog
        open={Boolean(txToVoid)}
        title="Batalkan (Void) Transaksi Ini?"
        description={
          txToVoid
            ? `Transaksi senilai ${formatRupiah(
                txToVoid.totalRupiah
              )} akan dibatalkan dan dikeluarkan dari perhitungan catatan buku shift ini.`
            : ''
        }
        confirmLabel="Ya, Void Transaksi"
        variant="danger"
        onConfirm={handleVoidConfirm}
        onCancel={() => setTxToVoid(null)}
      />
    </div>
  );
};

interface ShiftNotesScreenProps {
  activeShift: Shift | undefined;
  latestShift: Shift | undefined;
  transactionsByShift: Map<string, Transaction[]>;
}

export const ShiftNotesScreen: React.FC<ShiftNotesScreenProps> = ({
  activeShift,
  latestShift,
  transactionsByShift,
}) => {
  const targetShift = activeShift ?? latestShift;

  if (!targetShift) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xs">
        <h2 className="text-base font-bold text-stone-900">Belum Ada Catatan Shift</h2>
        <p className="mt-1 text-sm text-stone-600">
          Tekan tombol <strong>Mulai Shift</strong> di bagian atas untuk memulai pencatatan
          penjualan.
        </p>
      </div>
    );
  }

  const txs = transactionsByShift.get(targetShift.id) ?? [];

  return <ShiftNotesCard shift={targetShift} transactions={txs} />;
};

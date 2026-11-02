import React, { useState } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import type { Shift, ShiftLabel } from '../../types';
import { formatJakartaDateTime } from '../../domain/money';
import { closeActiveShift, startNewShift } from '../../db/repositories';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface ShiftBannerProps {
  activeShift: Shift | undefined;
  onShiftChanged?: () => void;
}

const SHIFT_LABELS: ShiftLabel[] = ['Pagi', 'Siang', 'Malam', 'Lainnya'];

export const ShiftBanner: React.FC<ShiftBannerProps> = ({ activeShift, onShiftChanged }) => {
  const [selectedLabel, setSelectedLabel] = useState<ShiftLabel>('Pagi');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const handleStartShift = async () => {
    setBusy(true);
    setError(null);
    try {
      await startNewShift(selectedLabel);
      onShiftChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai shift.');
    } finally {
      setBusy(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;
    setBusy(true);
    setError(null);
    try {
      await closeActiveShift(activeShift.id);
      setConfirmEndOpen(false);
      onShiftChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengakhiri shift.');
    } finally {
      setBusy(false);
    }
  };

  if (!activeShift) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm sm:text-base">
              <Clock className="h-5 w-5 text-amber-700 shrink-0" />
              <span>Belum Ada Shift Aktif</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 mt-0.5">
              Mulai shift terlebih dahulu agar transaksi kasir dapat disimpan ke catatan buku.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="shift-label-select" className="sr-only">
              Pilih Label Shift
            </label>
            <select
              id="shift-label-select"
              aria-label="Pilih Label Shift"
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value as ShiftLabel)}
              className="min-h-[44px] rounded-xl border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-stone-900"
            >
              {SHIFT_LABELS.map((lbl) => (
                <option key={lbl} value={lbl}>
                  Shift {lbl}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={handleStartShift}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Mulai Shift</span>
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-3 sm:px-4 sm:py-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-600 animate-pulse" />
          <div>
            <div className="text-sm sm:text-base font-bold text-emerald-950">
              Shift Aktif: {activeShift.label}
            </div>
            <div className="text-xs text-emerald-800">
              Mulai: {formatJakartaDateTime(activeShift.startedAt)} WIB
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmEndOpen(true)}
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-800 hover:bg-stone-100 active:bg-stone-200"
        >
          <Square className="h-3.5 w-3.5 text-red-600 fill-red-600" />
          <span>Akhiri Shift</span>
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmEndOpen}
        title={`Akhiri Shift ${activeShift.label}?`}
        description="Setelah shift diakhiri, transaksi baru tidak bisa ditambahkan ke shift ini. Anda dapat menyalin rekap 2 kolom ke buku fisik dan menandai Sudah Disalin."
        confirmLabel="Ya, Akhiri Shift"
        variant="danger"
        onConfirm={handleEndShift}
        onCancel={() => setConfirmEndOpen(false)}
      />
    </div>
  );
};

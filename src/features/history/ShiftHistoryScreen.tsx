import React, { useState } from 'react';
import { Calendar, Eye } from 'lucide-react';
import type { Shift, Transaction } from '../../types';
import { buildShiftLedger } from '../../domain/ledger';
import { formatJakartaDateTime, formatRupiah } from '../../domain/money';
import { ShiftNotesCard } from '../shifts/ShiftNotesScreen';

interface ShiftHistoryScreenProps {
  shifts: Shift[];
  transactionsByShift: Map<string, Transaction[]>;
}

export const ShiftHistoryScreen: React.FC<ShiftHistoryScreenProps> = ({
  shifts,
  transactionsByShift,
}) => {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(
    shifts[0]?.id ?? null
  );

  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xs">
        <h2 className="text-base font-bold text-stone-900">Belum Ada Riwayat Shift</h2>
        <p className="mt-1 text-sm text-stone-600">
          Riwayat sesi kerja yang sudah dimulai maupun ditutup akan muncul di sini.
        </p>
      </div>
    );
  }

  const selectedShift =
    shifts.find((s) => s.id === selectedShiftId) ?? shifts[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
      {/* Left: List of Shifts */}
      <div className="lg:col-span-5 space-y-2.5">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-700 px-1">
          Daftar Sesi Shift ({shifts.length})
        </h2>

        <div className="space-y-2">
          {shifts.map((shift) => {
            const txs = transactionsByShift.get(shift.id) ?? [];
            const summary = buildShiftLedger(txs);
            const isSelected = selectedShift?.id === shift.id;
            const isCopied = shift.copyStatus === 'COPIED';

            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => setSelectedShiftId(shift.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/90 ring-1 ring-amber-500'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-700" />
                    <span className="font-extrabold text-sm text-stone-900">
                      Shift {shift.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        shift.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {shift.status === 'OPEN' ? 'Aktif' : 'Tutup'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isCopied
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isCopied ? 'Sudah disalin' : 'Belum disalin'}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 text-xs text-stone-600">
                  Mulai: {formatJakartaDateTime(shift.startedAt)} WIB
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-stone-200/80 pt-2">
                  <span className="text-xs font-medium text-stone-600">
                    {summary.completedTransactionCount} transaksi
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-extrabold text-stone-900">
                    {formatRupiah(summary.totalRupiah)}
                    <Eye className="h-3.5 w-3.5 text-stone-400 ml-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Shift Notes Detail */}
      <div className="lg:col-span-7">
        {selectedShift && (
          <ShiftNotesCard
            shift={selectedShift}
            transactions={transactionsByShift.get(selectedShift.id) ?? []}
          />
        )}
      </div>
    </div>
  );
};

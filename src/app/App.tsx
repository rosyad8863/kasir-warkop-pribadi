import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BookOpen,
  Calculator,
  Coffee,
  History,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { CartItem, Transaction } from '../types';
import { db, ensureDatabaseInitialized } from '../db/schema';
import { ShiftBanner } from '../features/shifts/ShiftBanner';
import { CashierScreen } from '../features/cashier/CashierScreen';
import { ShiftNotesScreen } from '../features/shifts/ShiftNotesScreen';
import { ShiftHistoryScreen } from '../features/history/ShiftHistoryScreen';
import { SettingsAndMenuScreen } from '../features/products/SettingsAndMenuScreen';

export type AppTab = 'cashier' | 'notes' | 'history' | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('cashier');
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Persistent cart & cash input across tab switches / viewport resize (AC-19)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashInput, setCashInput] = useState<string>('');

  useEffect(() => {
    ensureDatabaseInitialized()
      .then(() => setDbReady(true))
      .catch((err) =>
        setInitError(
          err instanceof Error ? err.message : 'Gagal menyiapkan database lokal.'
        )
      );
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const products = useLiveQuery(() => db.products.toArray(), [], []);
  const shifts = useLiveQuery(
    () => db.shifts.orderBy('startedAt').reverse().toArray(),
    [],
    []
  );
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().toArray(),
    [],
    []
  );
  const appMeta = useLiveQuery(() => db.appMeta.get('singleton'), []);

  const activeShift = useMemo(
    () => shifts.find((s) => s.status === 'OPEN'),
    [shifts]
  );

  const latestShift = useMemo(() => shifts[0], [shifts]);

  const transactionsByShift = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.shiftId) ?? [];
      list.push(tx);
      map.set(tx.shiftId, list);
    }
    return map;
  }, [transactions]);

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-100">
        <div className="max-w-md rounded-2xl border border-red-300 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-extrabold text-red-700">
            Gagal Membuka Penyimpanan Lokal
          </h1>
          <p className="mt-2 text-sm text-stone-700">{initError}</p>
        </div>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
        <div className="text-sm font-bold text-stone-600">
          Menyiapkan Kasir Warkop Pribadi...
        </div>
      </div>
    );
  }

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'cashier',
      label: 'Kasir',
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      id: 'notes',
      label: 'Catatan Shift',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: 'history',
      label: 'Riwayat Shift',
      icon: <History className="h-4 w-4" />,
    },
    {
      id: 'settings',
      label: 'Pengaturan/Menu',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900">
      {/* Top Header */}
      <header className="bg-stone-900 text-white shadow-xs">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-black">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none">
                Kasir Warkop Pribadi
              </h1>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Offline-First · Rekap Buku 2 Kolom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              title={
                isOnline
                  ? 'Perangkat terhubung internet (data tetap disimpan lokal)'
                  : 'Mode Offline Aktif (aplikasi berjalan tanpa internet)'
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                isOnline
                  ? 'bg-stone-800 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Siap Offline</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Mode Offline</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Navigasi Utama"
          className="mx-auto max-w-7xl px-2 sm:px-6 border-t border-stone-800"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 py-1.5">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition ${
                    active
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 py-4 space-y-4">
        <ShiftBanner activeShift={activeShift} />

        {activeTab === 'cashier' && (
          <CashierScreen
            products={products}
            activeShift={activeShift}
            cart={cart}
            setCart={setCart}
            cashInput={cashInput}
            setCashInput={setCashInput}
          />
        )}

        {activeTab === 'notes' && (
          <ShiftNotesScreen
            activeShift={activeShift}
            latestShift={latestShift}
            transactionsByShift={transactionsByShift}
          />
        )}

        {activeTab === 'history' && (
          <ShiftHistoryScreen
            shifts={shifts}
            transactionsByShift={transactionsByShift}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAndMenuScreen
            products={products}
            activeShift={activeShift}
            appMeta={appMeta}
          />
        )}
      </main>
    </div>
  );
};

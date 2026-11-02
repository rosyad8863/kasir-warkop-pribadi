import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import type { CartItem, Product, ProductCategory, Shift, Transaction } from '../../types';
import {
  addProductToCart,
  calculateCartTotal,
  calculateCartTotalItems,
  removeCartItem,
  updateCartItemQuantity,
} from '../../domain/cart';
import {
  calculateLineSubtotal,
  calculatePaymentSummary,
  formatRupiah,
  formatRupiahNumber,
  parseRupiahInput,
} from '../../domain/money';
import { recordCashTransaction } from '../../db/repositories';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface CashierScreenProps {
  products: Product[];
  activeShift: Shift | undefined;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cashInput: string;
  setCashInput: React.Dispatch<React.SetStateAction<string>>;
}

type CategoryFilter = 'Semua' | ProductCategory;

const QUICK_NOMINALS = [10000, 20000, 50000, 100000];

export const CashierScreen: React.FC<CashierScreenProps> = ({
  products,
  activeShift,
  cart,
  setCart,
  cashInput,
  setCashInput,
}) => {
  const [category, setCategory] = useState<CategoryFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedTx, setLastSavedTx] = useState<Transaction | null>(null);
  const [confirmClearCart, setConfirmClearCart] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search input when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (category !== 'Semua' && p.category !== category) return false;
      if (normalizedQuery && !p.name.toLowerCase().includes(normalizedQuery)) return false;
      return true;
    });
  }, [products, category, searchQuery]);

  const cartQuantityByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(item.productId, item.quantity);
    }
    return map;
  }, [cart]);

  const totalRupiah = useMemo(() => calculateCartTotal(cart), [cart]);
  const totalItems = useMemo(() => calculateCartTotalItems(cart), [cart]);

  const parsedCash = useMemo(() => parseRupiahInput(cashInput), [cashInput]);
  const paymentSummary = useMemo(
    () => calculatePaymentSummary(totalRupiah, parsedCash),
    [totalRupiah, parsedCash]
  );

  const canSave =
    Boolean(activeShift) &&
    totalRupiah > 0 &&
    paymentSummary.isValidPayment &&
    !isSaving;

  const handleAddProduct = (product: Product) => {
    setSaveError(null);
    setCart((prev) => addProductToCart(prev, product));
  };

  const handleDeltaQty = (productId: string, delta: number) => {
    setSaveError(null);
    setCart((prev) => updateCartItemQuantity(prev, productId, delta));
  };

  const handleRemoveItem = (productId: string) => {
    setSaveError(null);
    setCart((prev) => removeCartItem(prev, productId));
  };

  const handleQuickCash = (amount: number) => {
    setSaveError(null);
    setCashInput(String(amount));
  };

  const handleSaveTransaction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSaving) return;

    setSaveError(null);

    if (!activeShift) {
      setSaveError('Belum ada shift aktif. Silakan tekan Mulai Shift terlebih dahulu.');
      return;
    }

    if (cart.length === 0) {
      setSaveError('Keranjang masih kosong. Pilih minimal 1 menu.');
      return;
    }

    if (!paymentSummary.isValidPayment || parsedCash === null) {
      setSaveError(paymentSummary.reason ?? 'Nominal uang diterima belum cukup.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await recordCashTransaction({
        cart,
        cashReceivedRupiah: parsedCash,
      });
      setLastSavedTx(saved);
      setCart([]);
      setCashInput('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewTransactionReset = () => {
    setLastSavedTx(null);
    setSaveError(null);
    setCart([]);
    setCashInput('');
  };

  return (
    <div className="space-y-4">
      {lastSavedTx && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 shadow-xs"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-emerald-950">
                  Transaksi Berhasil Disimpan!
                </h2>
                <p className="text-sm text-emerald-900 mt-0.5">
                  Total:{' '}
                  <strong className="font-bold">{formatRupiah(lastSavedTx.totalRupiah)}</strong> ·
                  Tunai: <strong className="font-bold">{formatRupiah(lastSavedTx.cashReceivedRupiah)}</strong>{' '}
                  · Kembalian:{' '}
                  <strong className="font-extrabold text-emerald-800 underline">
                    {formatRupiah(lastSavedTx.changeRupiah)}
                  </strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNewTransactionReset}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* LEFT PANEL: PRODUCT CATALOG */}
        <section
          aria-label="Katalog Menu"
          className="lg:col-span-7 xl:col-span-8 space-y-3"
        >
          <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 shadow-xs space-y-3">
            {/* Search and Category Filters */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu (misal: Es Teh, Kopi, Mie)... [tekan /]"
                  aria-label="Cari nama menu"
                  className="min-h-[44px] w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-10 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Bersihkan pencarian"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div
                role="group"
                aria-label="Filter Kategori Menu"
                className="grid grid-cols-3 gap-1.5 sm:flex"
              >
                {(['Semua', 'Minuman', 'Makanan'] as CategoryFilter[]).map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      aria-pressed={active}
                      className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
                        active
                          ? 'bg-stone-900 text-amber-300 shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid */}
            {activeProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                Tidak ada menu yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                {activeProducts.map((product) => {
                  const qtyInCart = cartQuantityByProduct.get(product.id) ?? 0;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className={`group relative flex min-h-[76px] flex-col justify-between rounded-xl border p-3 text-left transition active:scale-[0.99] ${
                        qtyInCart > 0
                          ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-500'
                          : 'border-stone-200 bg-stone-50/70 hover:border-amber-400 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 w-full">
                        <span className="font-bold text-sm text-stone-900 leading-snug">
                          {product.name}
                        </span>
                        {qtyInCart > 0 && (
                          <span
                            aria-label={`${qtyInCart} di keranjang`}
                            className="inline-flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-amber-600 px-1.5 text-xs font-extrabold text-white"
                          >
                            {qtyInCart}x
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-stone-600">
                          {formatRupiah(product.priceRupiah)}
                        </span>
                        <span className="text-[11px] font-medium text-stone-500">
                          {product.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: CART & PAYMENT */}
        <section
          aria-label="Keranjang dan Pembayaran"
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4"
        >
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-extrabold text-stone-900">
                  Pesanan ({totalItems} item)
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearCart(true)}
                  className="min-h-[44px] inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">
                Keranjang kosong. Ketuk/klik menu untuk menambah pesanan.
              </div>
            ) : (
              <ul className="divide-y divide-stone-200 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => {
                  const subtotal = calculateLineSubtotal(
                    item.quantity,
                    item.unitPriceRupiah
                  );
                  return (
                    <li
                      key={item.productId}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-stone-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-600">
                          {formatRupiah(item.unitPriceRupiah)} × {item.quantity} ={' '}
                          <strong className="font-bold text-stone-900">
                            {formatRupiah(subtotal)}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Kurangi ${item.name}`}
                          onClick={() => handleDeltaQty(item.productId, -1)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-200 active:bg-stone-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span
                          aria-label={`Jumlah ${item.name}`}
                          className="min-w-[32px] text-center text-sm font-extrabold text-stone-900"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tambah ${item.name}`}
                          onClick={() => handleDeltaQty(item.productId, 1)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-200 active:bg-stone-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${item.name}`}
                          onClick={() => handleRemoveItem(item.productId)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Total Box */}
            <div className="rounded-xl bg-stone-900 p-3.5 text-white flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-300">Total Belanja</span>
              <span
                data-testid="cart-total-display"
                className="text-xl sm:text-2xl font-extrabold text-amber-300"
              >
                {formatRupiah(totalRupiah)}
              </span>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSaveTransaction} className="space-y-3">
              <div>
                <label
                  htmlFor="cash-received-input"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1"
                >
                  Uang Diterima (Rp)
                </label>
                <input
                  id="cash-received-input"
                  type="text"
                  inputMode="numeric"
                  value={cashInput}
                  onChange={(e) => {
                    setSaveError(null);
                    setCashInput(e.target.value);
                  }}
                  placeholder="Contoh: 50000"
                  className="min-h-[48px] w-full rounded-xl border-2 border-stone-300 bg-white px-3.5 py-2 text-lg font-extrabold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-amber-600"
                />
              </div>

              {/* Quick Nominals */}
              <div className="flex flex-wrap gap-1.5">
                {totalRupiah > 0 && (
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalRupiah)}
                    className="min-h-[44px] rounded-xl border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100"
                  >
                    Uang Pas ({formatRupiahNumber(totalRupiah)})
                  </button>
                )}
                {QUICK_NOMINALS.map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => handleQuickCash(nom)}
                    className="min-h-[44px] rounded-xl border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-200"
                  >
                    {formatRupiahNumber(nom)}
                  </button>
                ))}
              </div>

              {/* Change / Shortage Display */}
              <div
                aria-live="polite"
                className={`rounded-xl border p-3 ${
                  totalRupiah > 0 && paymentSummary.isValidPayment
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : totalRupiah > 0 && cashInput.trim().length > 0
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-stone-200 bg-stone-50 text-stone-700'
                }`}
              >
                {totalRupiah === 0 ? (
                  <div className="text-xs font-medium">
                    Pilih menu terlebih dahulu untuk menghitung kembalian.
                  </div>
                ) : paymentSummary.isValidPayment ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Kembalian</span>
                    <span
                      data-testid="change-display"
                      className="text-lg font-extrabold text-emerald-800"
                    >
                      {formatRupiah(paymentSummary.changeRupiah)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Status Pembayaran</span>
                    <span
                      data-testid="payment-warning"
                      className="text-sm font-extrabold text-red-700"
                    >
                      {paymentSummary.reason}
                    </span>
                  </div>
                )}
              </div>

              {!activeShift && (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs font-semibold text-amber-950"
                >
                  Belum ada shift aktif. Tekan tombol <strong>Mulai Shift</strong> di bagian atas
                  untuk bisa menyimpan transaksi.
                </p>
              )}

              {saveError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs font-bold text-red-800"
                >
                  {saveError}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSave}
                className="min-h-[50px] w-full rounded-xl bg-amber-600 px-4 py-3 text-base font-extrabold text-white shadow-sm hover:bg-amber-700 active:bg-amber-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmClearCart}
        title="Kosongkan Keranjang?"
        description="Seluruh item di keranjang saat ini akan dihapus. Catatan transaksi shift yang sudah tersimpan tidak akan terpengaruh."
        confirmLabel="Ya, Kosongkan"
        variant="danger"
        onConfirm={() => {
          setCart([]);
          setCashInput('');
          setConfirmClearCart(false);
        }}
        onCancel={() => setConfirmClearCart(false)}
      />
    </div>
  );
};

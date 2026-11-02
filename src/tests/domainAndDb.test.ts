import { beforeEach, describe, expect, it } from 'vitest';
import {
  KasirWarkopDatabase,
  ensureDatabaseInitialized,
} from '../db/schema';
import { INITIAL_SEED_PRODUCTS } from '../db/seedProducts';
import {
  closeActiveShift,
  exportDatabaseBackup,
  markShiftCopiedStatus,
  recordCashTransaction,
  restoreDatabaseFromBackup,
  saveProduct,
  startNewShift,
  voidTransaction,
} from '../db/repositories';
import {
  addProductToCart,
  calculateCartTotal,
} from '../domain/cart';
import {
  calculatePaymentSummary,
  formatRupiah,
} from '../domain/money';
import {
  buildShiftLedger,
  formatLedgerTwoColumnText,
} from '../domain/ledger';
import { validateBackupJson } from '../domain/validation';
import type { CartItem } from '../types';

describe('Kasir Warkop Pribadi — Domain & Database Acceptance Criteria (AC-01 s.d. AC-22)', () => {
  let testDb: KasirWarkopDatabase;

  beforeEach(async () => {
    testDb = new KasirWarkopDatabase(`TestDB_${Date.now()}_${Math.random()}`);
    await ensureDatabaseInitialized(testDb);
  });

  it('AC-14: memuat tepat 37 produk awal (35 minuman, 2 makanan) sesuai PRD dan tidak menimpa edit saat init ulang', async () => {
    const products = await testDb.products.toArray();
    expect(products).toHaveLength(37);
    expect(INITIAL_SEED_PRODUCTS).toHaveLength(37);

    const minuman = products.filter((p) => p.category === 'Minuman');
    const makanan = products.filter((p) => p.category === 'Makanan');
    expect(minuman).toHaveLength(35);
    expect(makanan).toHaveLength(2);

    // Edit 1 produk lalu panggil ensureDatabaseInitialized lagi
    await saveProduct({
      id: 'es-teh',
      name: 'Es Teh Jumbo',
      category: 'Minuman',
      priceRupiah: 5000,
      targetDb: testDb,
    });
    await ensureDatabaseInitialized(testDb);

    const esTeh = await testDb.products.get('es-teh');
    expect(esTeh?.name).toBe('Es Teh Jumbo');
    expect(esTeh?.priceRupiah).toBe(5000);
  });

  it('AC-01, AC-02, AC-03: 3 Es Teh + 2 Kopi Cangkir + 1 Mie + Telur = Rp31.000; bayar 50.000 kembali 19.000; bayar 20.000 kurang 11.000', async () => {
    const esTeh = (await testDb.products.get('es-teh'))!;
    const kopiCangkir = (await testDb.products.get('kopi-cangkir'))!;
    const mieTelur = (await testDb.products.get('mie-telur'))!;

    let cart: CartItem[] = [];
    cart = addProductToCart(cart, esTeh);
    cart = addProductToCart(cart, esTeh);
    cart = addProductToCart(cart, esTeh);
    cart = addProductToCart(cart, kopiCangkir);
    cart = addProductToCart(cart, kopiCangkir);
    cart = addProductToCart(cart, mieTelur);

    const total = calculateCartTotal(cart);
    expect(total).toBe(31000);
    expect(formatRupiah(total)).toBe('Rp31.000');

    // AC-02: dibayar 50.000 -> kembalian 19.000
    const payEnough = calculatePaymentSummary(total, 50000);
    expect(payEnough.isValidPayment).toBe(true);
    expect(payEnough.changeRupiah).toBe(19000);

    // AC-03: dibayar 20.000 -> kurang Rp11.000
    const payShort = calculatePaymentSummary(total, 20000);
    expect(payShort.isValidPayment).toBe(false);
    expect(payShort.shortageRupiah).toBe(11000);
    expect(payShort.reason).toBe('Kurang Rp11.000');
  });

  it('AC-04 & AC-08: menolak simpan tanpa shift aktif, dan mencegah simpan ganda (anti-double-tap)', async () => {
    const esTeh = (await testDb.products.get('es-teh'))!;
    const cart = addProductToCart([], esTeh);

    await expect(
      recordCashTransaction({
        cart,
        cashReceivedRupiah: 10000,
        targetDb: testDb,
      })
    ).rejects.toThrow(/Belum ada shift aktif/i);

    await startNewShift('Pagi', testDb);

    // Simulasikan double-tap paralel
    const [res1, res2] = await Promise.allSettled([
      recordCashTransaction({
        cart,
        cashReceivedRupiah: 10000,
        targetDb: testDb,
      }),
      recordCashTransaction({
        cart,
        cashReceivedRupiah: 10000,
        targetDb: testDb,
      }),
    ]);

    const fulfilledCount = [res1, res2].filter((r) => r.status === 'fulfilled').length;
    expect(fulfilledCount).toBe(1);

    const savedTxs = await testDb.transactions.toArray();
    expect(savedTxs).toHaveLength(1);
  });

  it('AC-05, AC-07, BR-08: menggabungkan produk sejenis di shift yang sama, menjaga snapshot harga lama, dan memisahkan baris jika harga berubah', async () => {
    const shift = await startNewShift('Siang', testDb);
    const esTeh = (await testDb.products.get('es-teh'))!;
    const kopi = (await testDb.products.get('kopi-cangkir'))!;

    // Transaksi 1: Es Teh 3x (@4.000)
    let cart1: CartItem[] = [];
    cart1 = addProductToCart(cart1, esTeh);
    cart1 = addProductToCart(cart1, esTeh);
    cart1 = addProductToCart(cart1, esTeh);
    await recordCashTransaction({
      cart: cart1,
      cashReceivedRupiah: 20000,
      targetDb: testDb,
    });

    // Transaksi 2: Es Teh 2x (@4.000) + Kopi Cangkir 1x (@5.000)
    let cart2: CartItem[] = [];
    cart2 = addProductToCart(cart2, esTeh);
    cart2 = addProductToCart(cart2, esTeh);
    cart2 = addProductToCart(cart2, kopi);
    await recordCashTransaction({
      cart: cart2,
      cashReceivedRupiah: 20000,
      targetDb: testDb,
    });

    const txsBeforePriceChange = await testDb.transactions
      .where('shiftId')
      .equals(shift.id)
      .toArray();
    const ledger1 = buildShiftLedger(txsBeforePriceChange);

    // AC-05: Es Teh (5x) — 20.000
    const esTehRow = ledger1.rows.find((r) => r.productId === 'es-teh');
    expect(esTehRow?.displayName).toBe('Es Teh (5x)');
    expect(esTehRow?.amountRupiah).toBe(20000);
    expect(ledger1.totalRupiah).toBe(25000);

    // AC-07: Ubah harga Kopi Cangkir dari 5.000 ke 6.000 di tengah shift
    const updatedKopi = await saveProduct({
      id: 'kopi-cangkir',
      name: 'Kopi Cangkir',
      category: 'Minuman',
      priceRupiah: 6000,
      targetDb: testDb,
    });

    const cart3 = addProductToCart([], updatedKopi);
    await recordCashTransaction({
      cart: cart3,
      cashReceivedRupiah: 10000,
      targetDb: testDb,
    });

    const allTxs = await testDb.transactions.where('shiftId').equals(shift.id).toArray();
    const ledger2 = buildShiftLedger(allTxs);

    // BR-08: Karena Kopi Cangkir punya 2 harga di shift yang sama, tampilkan @5.000 dan @6.000
    const kopiRows = ledger2.rows.filter((r) => r.productId === 'kopi-cangkir');
    expect(kopiRows).toHaveLength(2);
    expect(kopiRows[0].displayName).toBe('Kopi Cangkir (1x @5.000)');
    expect(kopiRows[0].amountRupiah).toBe(5000);
    expect(kopiRows[1].displayName).toBe('Kopi Cangkir (1x @6.000)');
    expect(kopiRows[1].amountRupiah).toBe(6000);
  });

  it('AC-09, AC-10, AC-11, AC-15, AC-16: shift lintas tengah malam, void transaksi, salin teks 2 kolom, dan kunci status Sudah Disalin', async () => {
    // AC-15: Mulai shift pukul 23:30, transaksi pukul 00:15
    const shift1 = await startNewShift(
      'Malam',
      testDb,
      '2026-11-02T16:30:00.000Z' // 23:30 WIB
    );

    const esTeh = (await testDb.products.get('es-teh'))!;
    const mieTelur = (await testDb.products.get('mie-telur'))!;

    const tx1 = await recordCashTransaction({
      cart: addProductToCart([], esTeh),
      cashReceivedRupiah: 5000,
      targetDb: testDb,
      nowIso: '2026-11-02T16:40:00.000Z',
    });

    const tx2 = await recordCashTransaction({
      cart: addProductToCart([], mieTelur),
      cashReceivedRupiah: 10000,
      targetDb: testDb,
      nowIso: '2026-11-02T17:15:00.000Z', // 00:15 WIB hari berikutnya
    });

    expect(tx1.shiftId).toBe(shift1.id);
    expect(tx2.shiftId).toBe(shift1.id);

    // AC-16: Void tx2 sebelum disalin
    await voidTransaction(tx2.id, testDb);

    const shift1Txs = await testDb.transactions
      .where('shiftId')
      .equals(shift1.id)
      .toArray();
    const summary = buildShiftLedger(shift1Txs);
    expect(summary.totalRupiah).toBe(4000);
    expect(summary.completedTransactionCount).toBe(1);
    expect(summary.voidedTransactionCount).toBe(1);

    // AC-10: Format clipboard 2 kolom
    const clipboardText = formatLedgerTwoColumnText(summary);
    expect(clipboardText).toContain('Nama Makanan/Minuman\tHarga');
    expect(clipboardText).toContain('Es Teh (1x)\t4.000');
    expect(clipboardText).toContain('TOTAL\t4.000');

    // AC-11: Tandai Sudah Disalin hanya bisa setelah shift ditutup
    await expect(markShiftCopiedStatus(shift1.id, true, testDb)).rejects.toThrow(
      /harus diakhiri terlebih dahulu/i
    );

    await closeActiveShift(shift1.id, testDb);
    const copiedShift = await markShiftCopiedStatus(shift1.id, true, testDb);
    expect(copiedShift.copyStatus).toBe('COPIED');

    // BR-09: Tidak boleh void jika shift sudah COPIED
    await expect(voidTransaction(tx1.id, testDb)).rejects.toThrow(/Sudah Disalin/i);

    // AC-09: Buka shift baru, transaksi tidak tercampur
    const shift2 = await startNewShift('Pagi', testDb);
    expect(shift2.id).not.toBe(shift1.id);
  });

  it('AC-12, AC-22, BR-17: ekspor & restore backup JSON menjaga keutuhan data dan memblokir restore saat shift aktif', async () => {
    const shift = await startNewShift('Pagi', testDb);
    const esTeh = (await testDb.products.get('es-teh'))!;
    await recordCashTransaction({
      cart: addProductToCart(addProductToCart([], esTeh), esTeh),
      cashReceivedRupiah: 10000,
      targetDb: testDb,
    });
    await closeActiveShift(shift.id, testDb);

    const backupPayload = await exportDatabaseBackup(testDb);
    const jsonString = JSON.stringify(backupPayload);

    const validation = validateBackupJson(jsonString);
    expect(validation.valid).toBe(true);
    expect(validation.summary?.totalCompletedRevenueRupiah).toBe(8000);

    // Buat DB kedua yang memiliki shift aktif -> restore harus ditolak (BR-17)
    const targetDb = new KasirWarkopDatabase(`TargetDB_${Date.now()}`);
    await ensureDatabaseInitialized(targetDb);
    await startNewShift('Siang', targetDb);

    await expect(
      restoreDatabaseFromBackup(validation.payload!, { targetDb })
    ).rejects.toThrow(/Masih ada shift aktif/i);

    // Tutup shift di targetDb lalu restore
    const activeTargetShift = await targetDb.shifts.where('status').equals('OPEN').first();
    await closeActiveShift(activeTargetShift!.id, targetDb);

    await restoreDatabaseFromBackup(validation.payload!, { targetDb });
    const restoredTxs = await targetDb.transactions.toArray();
    expect(restoredTxs).toHaveLength(1);
    expect(restoredTxs[0].totalRupiah).toBe(8000);
  });
});

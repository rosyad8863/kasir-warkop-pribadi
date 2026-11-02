import type {
  BackupPayload,
  CartItem,
  Product,
  ProductCategory,
  Shift,
  ShiftLabel,
  Transaction,
} from '../types';
import {
  buildTransactionItemsSnapshot,
  calculateCartTotal,
} from '../domain/cart';
import { calculatePaymentSummary } from '../domain/money';
import { CURRENT_SCHEMA_VERSION, db, type KasirWarkopDatabase } from './schema';

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function slugifyId(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'menu'}-${Date.now().toString(36)}`;
}

// In-memory lock against concurrent double-tap transaction submission (BR-05 / AC-08)
let isSavingTransactionLock = false;

export async function getActiveShift(
  targetDb: KasirWarkopDatabase = db
): Promise<Shift | undefined> {
  return targetDb.shifts.where('status').equals('OPEN').first();
}

export async function startNewShift(
  label: ShiftLabel,
  targetDb: KasirWarkopDatabase = db,
  nowIso: string = new Date().toISOString()
): Promise<Shift> {
  return targetDb.transaction('rw', targetDb.shifts, async () => {
    const existingOpen = await targetDb.shifts.where('status').equals('OPEN').first();
    if (existingOpen) {
      throw new Error('Masih ada shift yang sedang aktif. Akhiri shift aktif terlebih dahulu.');
    }

    const shift: Shift = {
      id: generateId('shift'),
      label,
      startedAt: nowIso,
      endedAt: null,
      status: 'OPEN',
      copyStatus: 'NOT_COPIED',
      copiedAt: null,
    };

    await targetDb.shifts.add(shift);
    return shift;
  });
}

export async function closeActiveShift(
  shiftId: string,
  targetDb: KasirWarkopDatabase = db,
  nowIso: string = new Date().toISOString()
): Promise<Shift> {
  return targetDb.transaction('rw', targetDb.shifts, async () => {
    const shift = await targetDb.shifts.get(shiftId);
    if (!shift) {
      throw new Error('Data shift tidak ditemukan.');
    }
    if (shift.status === 'CLOSED') {
      return shift;
    }

    const updated: Shift = {
      ...shift,
      status: 'CLOSED',
      endedAt: nowIso,
    };
    await targetDb.shifts.put(updated);
    return updated;
  });
}

export async function markShiftCopiedStatus(
  shiftId: string,
  copied: boolean,
  targetDb: KasirWarkopDatabase = db,
  nowIso: string = new Date().toISOString()
): Promise<Shift> {
  return targetDb.transaction('rw', targetDb.shifts, async () => {
    const shift = await targetDb.shifts.get(shiftId);
    if (!shift) {
      throw new Error('Data shift tidak ditemukan.');
    }
    if (shift.status !== 'CLOSED') {
      throw new Error('Shift harus diakhiri terlebih dahulu sebelum ditandai Sudah Disalin.');
    }

    const updated: Shift = {
      ...shift,
      copyStatus: copied ? 'COPIED' : 'NOT_COPIED',
      copiedAt: copied ? nowIso : null,
    };
    await targetDb.shifts.put(updated);
    return updated;
  });
}

export async function recordCashTransaction(params: {
  cart: CartItem[];
  cashReceivedRupiah: number | null;
  targetDb?: KasirWarkopDatabase;
  nowIso?: string;
}): Promise<Transaction> {
  if (isSavingTransactionLock) {
    throw new Error('Transaksi sedang disimpan, mohon tunggu.');
  }

  isSavingTransactionLock = true;
  const targetDb = params.targetDb ?? db;
  const nowIso = params.nowIso ?? new Date().toISOString();

  try {
    return await targetDb.transaction(
      'rw',
      targetDb.shifts,
      targetDb.transactions,
      async () => {
        const activeShift = await targetDb.shifts.where('status').equals('OPEN').first();
        if (!activeShift) {
          throw new Error('Belum ada shift aktif. Silakan tekan Mulai Shift terlebih dahulu.');
        }

        if (!params.cart || params.cart.length === 0) {
          throw new Error('Keranjang masih kosong.');
        }

        const totalRupiah = calculateCartTotal(params.cart);
        const payment = calculatePaymentSummary(totalRupiah, params.cashReceivedRupiah);
        if (!payment.isValidPayment || params.cashReceivedRupiah === null) {
          throw new Error(payment.reason ?? 'Pembayaran belum valid.');
        }

        const items = buildTransactionItemsSnapshot(params.cart);

        const tx: Transaction = {
          id: generateId('tx'),
          shiftId: activeShift.id,
          createdAt: nowIso,
          status: 'COMPLETED',
          items,
          totalRupiah,
          cashReceivedRupiah: params.cashReceivedRupiah,
          changeRupiah: payment.changeRupiah,
          voidedAt: null,
        };

        await targetDb.transactions.add(tx);
        return tx;
      }
    );
  } finally {
    isSavingTransactionLock = false;
  }
}

export async function voidTransaction(
  transactionId: string,
  targetDb: KasirWarkopDatabase = db,
  nowIso: string = new Date().toISOString()
): Promise<Transaction> {
  return targetDb.transaction(
    'rw',
    targetDb.shifts,
    targetDb.transactions,
    async () => {
      const tx = await targetDb.transactions.get(transactionId);
      if (!tx) {
        throw new Error('Transaksi tidak ditemukan.');
      }
      if (tx.status === 'VOIDED') {
        return tx;
      }

      const shift = await targetDb.shifts.get(tx.shiftId);
      if (!shift) {
        throw new Error('Shift transaksi tidak ditemukan.');
      }

      if (shift.copyStatus === 'COPIED') {
        throw new Error(
          'Shift ini sudah ditandai Sudah Disalin ke buku. Batalkan tanda disalin terlebih dahulu jika ingin mengoreksi.'
        );
      }

      const updated: Transaction = {
        ...tx,
        status: 'VOIDED',
        voidedAt: nowIso,
      };
      await targetDb.transactions.put(updated);
      return updated;
    }
  );
}

export async function saveProduct(params: {
  id?: string;
  name: string;
  category: ProductCategory;
  priceRupiah: number;
  isActive?: boolean;
  targetDb?: KasirWarkopDatabase;
  nowIso?: string;
}): Promise<Product> {
  const targetDb = params.targetDb ?? db;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const trimmedName = params.name.trim();

  if (!trimmedName) {
    throw new Error('Nama menu tidak boleh kosong.');
  }
  if (!Number.isSafeInteger(params.priceRupiah) || params.priceRupiah < 0) {
    throw new Error('Harga harus berupa bilangan bulat Rupiah >= 0.');
  }

  return targetDb.transaction('rw', targetDb.products, async () => {
    if (params.id) {
      const existing = await targetDb.products.get(params.id);
      if (!existing) {
        throw new Error('Menu tidak ditemukan.');
      }
      const updated: Product = {
        ...existing,
        name: trimmedName,
        category: params.category,
        priceRupiah: params.priceRupiah,
        isActive: params.isActive ?? existing.isActive,
        updatedAt: nowIso,
      };
      await targetDb.products.put(updated);
      return updated;
    }

    const newProduct: Product = {
      id: slugifyId(trimmedName),
      name: trimmedName,
      category: params.category,
      priceRupiah: params.priceRupiah,
      isActive: params.isActive ?? true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await targetDb.products.add(newProduct);
    return newProduct;
  });
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean,
  targetDb: KasirWarkopDatabase = db,
  nowIso: string = new Date().toISOString()
): Promise<Product> {
  return targetDb.transaction('rw', targetDb.products, async () => {
    const existing = await targetDb.products.get(productId);
    if (!existing) {
      throw new Error('Menu tidak ditemukan.');
    }
    const updated: Product = {
      ...existing,
      isActive,
      updatedAt: nowIso,
    };
    await targetDb.products.put(updated);
    return updated;
  });
}

export async function exportDatabaseBackup(
  targetDb: KasirWarkopDatabase = db,
  nowIso: string = new Date().toISOString()
): Promise<BackupPayload> {
  return targetDb.transaction(
    'rw',
    targetDb.products,
    targetDb.shifts,
    targetDb.transactions,
    targetDb.appMeta,
    async () => {
      const [products, shifts, transactions, existingMeta] = await Promise.all([
        targetDb.products.toArray(),
        targetDb.shifts.toArray(),
        targetDb.transactions.toArray(),
        targetDb.appMeta.get('singleton'),
      ]);

      const updatedMeta = {
        key: 'singleton' as const,
        schemaVersion: existingMeta?.schemaVersion ?? CURRENT_SCHEMA_VERSION,
        initializedAt: existingMeta?.initializedAt ?? nowIso,
        lastBackupAt: nowIso,
      };

      await targetDb.appMeta.put(updatedMeta);

      return {
        app: 'kasir-warkop-pribadi',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: nowIso,
        products,
        shifts,
        transactions,
        appMeta: updatedMeta,
      };
    }
  );
}

export async function restoreDatabaseFromBackup(
  payload: BackupPayload,
  options?: {
    allowOverwriteOpenShift?: boolean;
    targetDb?: KasirWarkopDatabase;
  }
): Promise<void> {
  const targetDb = options?.targetDb ?? db;

  await targetDb.transaction(
    'rw',
    targetDb.products,
    targetDb.shifts,
    targetDb.transactions,
    targetDb.appMeta,
    async () => {
      const activeShift = await targetDb.shifts.where('status').equals('OPEN').first();
      if (activeShift && !options?.allowOverwriteOpenShift) {
        throw new Error(
          'Masih ada shift aktif di perangkat ini. Akhiri shift aktif terlebih dahulu sebelum melakukan Restore data.'
        );
      }

      await Promise.all([
        targetDb.products.clear(),
        targetDb.shifts.clear(),
        targetDb.transactions.clear(),
        targetDb.appMeta.clear(),
      ]);

      await Promise.all([
        targetDb.products.bulkPut(payload.products),
        targetDb.shifts.bulkPut(payload.shifts),
        targetDb.transactions.bulkPut(payload.transactions),
        targetDb.appMeta.put({
          ...payload.appMeta,
          key: 'singleton',
          schemaVersion: CURRENT_SCHEMA_VERSION,
        }),
      ]);
    }
  );
}

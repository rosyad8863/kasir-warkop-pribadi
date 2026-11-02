import type { BackupPayload, Product, Shift, Transaction } from '../types';

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  payload?: BackupPayload;
  summary?: {
    exportedAt: string;
    productCount: number;
    shiftCount: number;
    transactionCount: number;
    openShiftCount: number;
    totalCompletedRevenueRupiah: number;
  };
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isNonNegativeSafeInteger(val: unknown): val is number {
  return typeof val === 'number' && Number.isSafeInteger(val) && val >= 0;
}

export function validateBackupJson(rawText: string): BackupValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      valid: false,
      errors: ['Format berkas bukan JSON yang valid.'],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      valid: false,
      errors: ['Isi berkas JSON kosong atau tidak dikenali.'],
    };
  }

  const obj = parsed as Record<string, unknown>;
  const errors: string[] = [];

  if (obj.app !== 'kasir-warkop-pribadi') {
    errors.push('Identitas aplikasi pada berkas backup tidak cocok (`kasir-warkop-pribadi`).');
  }

  if (typeof obj.schemaVersion !== 'number' || obj.schemaVersion < 1) {
    errors.push('Versi skema (`schemaVersion`) tidak valid.');
  }

  if (!isNonEmptyString(obj.exportedAt)) {
    errors.push('Waktu ekspor (`exportedAt`) tidak valid.');
  }

  if (!Array.isArray(obj.products)) {
    errors.push('Daftar `products` tidak ditemukan atau bukan array.');
  }
  if (!Array.isArray(obj.shifts)) {
    errors.push('Daftar `shifts` tidak ditemukan atau bukan array.');
  }
  if (!Array.isArray(obj.transactions)) {
    errors.push('Daftar `transactions` tidak ditemukan atau bukan array.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const products = obj.products as Product[];
  const shifts = obj.shifts as Shift[];
  const transactions = obj.transactions as Transaction[];

  const productIds = new Set<string>();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p || typeof p !== 'object') {
      errors.push(`Produk indeks ${i} tidak valid.`);
      continue;
    }
    if (!isNonEmptyString(p.id)) {
      errors.push(`Produk indeks ${i} tidak memiliki ID.`);
    } else if (productIds.has(p.id)) {
      errors.push(`Duplikasi ID produk: ${p.id}.`);
    } else {
      productIds.add(p.id);
    }

    if (!isNonEmptyString(p.name)) {
      errors.push(`Produk ${p.id || i} tidak memiliki nama.`);
    }
    if (p.category !== 'Minuman' && p.category !== 'Makanan') {
      errors.push(`Kategori produk ${p.id || i} harus Minuman atau Makanan.`);
    }
    if (!isNonNegativeSafeInteger(p.priceRupiah)) {
      errors.push(`Harga produk ${p.id || i} harus bilangan bulat rupiah >= 0.`);
    }
  }

  const shiftIds = new Set<string>();
  let openShiftCount = 0;
  for (let i = 0; i < shifts.length; i++) {
    const s = shifts[i];
    if (!s || typeof s !== 'object') {
      errors.push(`Shift indeks ${i} tidak valid.`);
      continue;
    }
    if (!isNonEmptyString(s.id)) {
      errors.push(`Shift indeks ${i} tidak memiliki ID.`);
    } else if (shiftIds.has(s.id)) {
      errors.push(`Duplikasi ID shift: ${s.id}.`);
    } else {
      shiftIds.add(s.id);
    }

    if (!['Pagi', 'Siang', 'Malam', 'Lainnya'].includes(s.label)) {
      errors.push(`Label shift ${s.id || i} tidak valid.`);
    }
    if (s.status !== 'OPEN' && s.status !== 'CLOSED') {
      errors.push(`Status shift ${s.id || i} tidak valid.`);
    }
    if (s.status === 'OPEN') {
      openShiftCount += 1;
    }
    if (s.copyStatus !== 'NOT_COPIED' && s.copyStatus !== 'COPIED') {
      errors.push(`Status salin shift ${s.id || i} tidak valid.`);
    }
  }

  if (openShiftCount > 1) {
    errors.push('Berkas backup memiliki lebih dari satu shift berstatus OPEN.');
  }

  const txIds = new Set<string>();
  let totalCompletedRevenueRupiah = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!tx || typeof tx !== 'object') {
      errors.push(`Transaksi indeks ${i} tidak valid.`);
      continue;
    }
    if (!isNonEmptyString(tx.id)) {
      errors.push(`Transaksi indeks ${i} tidak memiliki ID.`);
    } else if (txIds.has(tx.id)) {
      errors.push(`Duplikasi ID transaksi: ${tx.id}.`);
    } else {
      txIds.add(tx.id);
    }

    if (!isNonEmptyString(tx.shiftId) || !shiftIds.has(tx.shiftId)) {
      errors.push(`Transaksi ${tx.id || i} merujuk ke shiftId yang tidak ditemukan (${tx.shiftId}).`);
    }

    if (tx.status !== 'COMPLETED' && tx.status !== 'VOIDED') {
      errors.push(`Status transaksi ${tx.id || i} tidak valid.`);
    }

    if (!Array.isArray(tx.items) || tx.items.length === 0) {
      errors.push(`Transaksi ${tx.id || i} tidak memiliki item.`);
      continue;
    }

    let computedTotal = 0;
    for (let j = 0; j < tx.items.length; j++) {
      const item = tx.items[j];
      if (!item || typeof item !== 'object') {
        errors.push(`Item transaksi ${tx.id}[${j}] tidak valid.`);
        continue;
      }
      if (!isNonEmptyString(item.productId) || !isNonEmptyString(item.productNameSnapshot)) {
        errors.push(`Item transaksi ${tx.id}[${j}] kehilangan snapshot produk.`);
      }
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
        errors.push(`Kuantitas item transaksi ${tx.id}[${j}] harus >= 1.`);
      }
      if (!isNonNegativeSafeInteger(item.unitPriceSnapshotRupiah)) {
        errors.push(`Harga satuan item transaksi ${tx.id}[${j}] tidak valid.`);
      }
      const expectedSubtotal = item.quantity * item.unitPriceSnapshotRupiah;
      if (item.subtotalRupiah !== expectedSubtotal) {
        errors.push(`Subtotal item transaksi ${tx.id}[${j}] tidak konsisten.`);
      }
      computedTotal += expectedSubtotal;
    }

    if (tx.totalRupiah !== computedTotal) {
      errors.push(
        `Total transaksi ${tx.id} (${tx.totalRupiah}) tidak cocok dengan jumlah item (${computedTotal}).`
      );
    }

    if (!isNonNegativeSafeInteger(tx.cashReceivedRupiah) || tx.cashReceivedRupiah < tx.totalRupiah) {
      errors.push(`Uang diterima pada transaksi ${tx.id} kurang dari total belanja.`);
    }

    if (tx.changeRupiah !== tx.cashReceivedRupiah - tx.totalRupiah) {
      errors.push(`Kembalian pada transaksi ${tx.id} tidak konsisten.`);
    }

    if (tx.status === 'COMPLETED') {
      totalCompletedRevenueRupiah += tx.totalRupiah;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const appMeta =
    obj.appMeta && typeof obj.appMeta === 'object'
      ? (obj.appMeta as BackupPayload['appMeta'])
      : {
          key: 'singleton' as const,
          schemaVersion: obj.schemaVersion as number,
          initializedAt: obj.exportedAt as string,
          lastBackupAt: obj.exportedAt as string,
        };

  const payload: BackupPayload = {
    app: 'kasir-warkop-pribadi',
    schemaVersion: obj.schemaVersion as number,
    exportedAt: obj.exportedAt as string,
    products,
    shifts,
    transactions,
    appMeta: {
      ...appMeta,
      key: 'singleton',
    },
  };

  return {
    valid: true,
    errors: [],
    payload,
    summary: {
      exportedAt: payload.exportedAt,
      productCount: products.length,
      shiftCount: shifts.length,
      transactionCount: transactions.length,
      openShiftCount,
      totalCompletedRevenueRupiah,
    },
  };
}

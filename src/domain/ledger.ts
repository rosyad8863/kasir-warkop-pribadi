import type { LedgerRow, Transaction } from '../types';
import { formatJakartaTimeOnly, formatRupiahNumber } from './money';

export interface ShiftLedgerSummary {
  rows: LedgerRow[];
  totalRupiah: number;
  completedTransactionCount: number;
  voidedTransactionCount: number;
}

export function buildShiftLedger(transactions: Transaction[]): ShiftLedgerSummary {
  const groups = new Map<
    string,
    {
      key: string;
      productId: string;
      baseName: string;
      unitPriceRupiah: number;
      quantity: number;
      amountRupiah: number;
    }
  >();

  let completedTransactionCount = 0;
  let voidedTransactionCount = 0;
  let totalRupiah = 0;

  for (const tx of transactions) {
    if (tx.status === 'VOIDED') {
      voidedTransactionCount += 1;
      continue;
    }
    if (tx.status !== 'COMPLETED') continue;

    completedTransactionCount += 1;

    for (const item of tx.items) {
      const key = JSON.stringify([
        item.productId,
        item.productNameSnapshot,
        item.unitPriceSnapshotRupiah,
      ]);
      const existing = groups.get(key) ?? {
        key,
        productId: item.productId,
        baseName: item.productNameSnapshot,
        unitPriceRupiah: item.unitPriceSnapshotRupiah,
        quantity: 0,
        amountRupiah: 0,
      };
      const lineAmount = item.quantity * item.unitPriceSnapshotRupiah;
      existing.quantity += item.quantity;
      existing.amountRupiah += lineAmount;
      totalRupiah += lineAmount;
      groups.set(key, existing);
    }
  }

  // Detect if same baseName (or productId) appears with multiple unit prices in this shift (BR-08)
  const priceSetByBaseName = new Map<string, Set<number>>();
  const priceSetByProductId = new Map<string, Set<number>>();

  for (const entry of groups.values()) {
    const nameKey = entry.baseName.trim().toLowerCase();
    const namePrices = priceSetByBaseName.get(nameKey) ?? new Set<number>();
    namePrices.add(entry.unitPriceRupiah);
    priceSetByBaseName.set(nameKey, namePrices);

    const idPrices = priceSetByProductId.get(entry.productId) ?? new Set<number>();
    idPrices.add(entry.unitPriceRupiah);
    priceSetByProductId.set(entry.productId, idPrices);
  }

  const rows: LedgerRow[] = [...groups.values()]
    .map((entry) => {
      const nameKey = entry.baseName.trim().toLowerCase();
      const hasMultiplePrices =
        (priceSetByBaseName.get(nameKey)?.size ?? 0) > 1 ||
        (priceSetByProductId.get(entry.productId)?.size ?? 0) > 1;

      const displayName = hasMultiplePrices
        ? `${entry.baseName} (${entry.quantity}x @${formatRupiahNumber(entry.unitPriceRupiah)})`
        : `${entry.baseName} (${entry.quantity}x)`;

      return {
        key: entry.key,
        productId: entry.productId,
        baseName: entry.baseName,
        displayName,
        unitPriceRupiah: entry.unitPriceRupiah,
        quantity: entry.quantity,
        amountRupiah: entry.amountRupiah,
        hasMultiplePricesForSameName: hasMultiplePrices,
      };
    })
    .sort((a, b) => {
      const cmp = a.baseName.localeCompare(b.baseName, 'id');
      if (cmp !== 0) return cmp;
      return a.unitPriceRupiah - b.unitPriceRupiah;
    });

  return {
    rows,
    totalRupiah,
    completedTransactionCount,
    voidedTransactionCount,
  };
}

export function formatLedgerTwoColumnText(summary: ShiftLedgerSummary): string {
  const lines = [
    'Nama Makanan/Minuman\tHarga',
    ...summary.rows.map(
      (row) => `${row.displayName}\t${formatRupiahNumber(row.amountRupiah)}`
    ),
    `TOTAL\t${formatRupiahNumber(summary.totalRupiah)}`,
  ];
  return lines.join('\n');
}

export function formatSingleOrderTwoColumnText(
  tx: Transaction,
  orderNumber?: number
): string {
  const headerPrefix =
    orderNumber !== undefined
      ? `Pesanan #${orderNumber} (${formatJakartaTimeOnly(tx.createdAt)} WIB)`
      : `Pesanan (${formatJakartaTimeOnly(tx.createdAt)} WIB)`;

  const lines = [
    headerPrefix,
    'Nama Makanan/Minuman\tHarga',
    ...tx.items.map(
      (item) =>
        `${item.productNameSnapshot} (${item.quantity}x)\t${formatRupiahNumber(
          item.subtotalRupiah
        )}`
    ),
    `TOTAL\t${formatRupiahNumber(tx.totalRupiah)}`,
  ];
  return lines.join('\n');
}

export type ProductCategory = 'Minuman' | 'Makanan';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceRupiah: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ShiftLabel = 'Pagi' | 'Siang' | 'Malam' | 'Lainnya';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type CopyStatus = 'NOT_COPIED' | 'COPIED';

export interface Shift {
  id: string;
  label: ShiftLabel;
  startedAt: string;
  endedAt: string | null;
  status: ShiftStatus;
  copyStatus: CopyStatus;
  copiedAt: string | null;
}

export type TransactionStatus = 'COMPLETED' | 'VOIDED';

export interface TransactionItem {
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshotRupiah: number;
  quantity: number;
  subtotalRupiah: number;
}

export interface Transaction {
  id: string;
  shiftId: string;
  createdAt: string;
  status: TransactionStatus;
  items: TransactionItem[];
  totalRupiah: number;
  cashReceivedRupiah: number;
  changeRupiah: number;
  voidedAt: string | null;
}

export interface AppMeta {
  key: 'singleton';
  schemaVersion: number;
  initializedAt: string;
  lastBackupAt: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  unitPriceRupiah: number;
  quantity: number;
}

export interface LedgerRow {
  key: string;
  productId: string;
  baseName: string;
  displayName: string;
  unitPriceRupiah: number;
  quantity: number;
  amountRupiah: number;
  hasMultiplePricesForSameName: boolean;
}

export interface BackupPayload {
  app: 'kasir-warkop-pribadi';
  schemaVersion: number;
  exportedAt: string;
  products: Product[];
  shifts: Shift[];
  transactions: Transaction[];
  appMeta: AppMeta;
}

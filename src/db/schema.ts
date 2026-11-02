import Dexie, { type Table } from 'dexie';
import type { AppMeta, Product, Shift, Transaction } from '../types';
import { createSeedProducts } from './seedProducts';

export const CURRENT_SCHEMA_VERSION = 1;

export class KasirWarkopDatabase extends Dexie {
  products!: Table<Product, string>;
  shifts!: Table<Shift, string>;
  transactions!: Table<Transaction, string>;
  appMeta!: Table<AppMeta, string>;

  constructor(dbName = 'KasirWarkopPribadiDB') {
    super(dbName);

    this.version(1).stores({
      products: 'id, name, category, isActive',
      shifts: 'id, status, copyStatus, startedAt',
      transactions: 'id, shiftId, status, createdAt, [shiftId+status]',
      appMeta: 'key',
    });
  }
}

export const db = new KasirWarkopDatabase();

let initPromise: Promise<void> | null = null;

export async function ensureDatabaseInitialized(targetDb: KasirWarkopDatabase = db): Promise<void> {
  if (targetDb === db && initPromise) {
    return initPromise;
  }

  const runInit = async () => {
    await targetDb.transaction('rw', targetDb.products, targetDb.appMeta, async () => {
      const existingMeta = await targetDb.appMeta.get('singleton');
      if (existingMeta) {
        if (existingMeta.schemaVersion < CURRENT_SCHEMA_VERSION) {
          await targetDb.appMeta.put({
            ...existingMeta,
            schemaVersion: CURRENT_SCHEMA_VERSION,
          });
        }
        return;
      }

      const nowIso = new Date().toISOString();
      const productCount = await targetDb.products.count();
      if (productCount === 0) {
        await targetDb.products.bulkPut(createSeedProducts(nowIso));
      }

      await targetDb.appMeta.put({
        key: 'singleton',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        initializedAt: nowIso,
        lastBackupAt: null,
      });
    });
  };

  if (targetDb === db) {
    initPromise = runInit().catch((err) => {
      initPromise = null;
      throw err;
    });
    return initPromise;
  }

  return runInit();
}

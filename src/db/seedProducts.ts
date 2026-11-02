import type { Product, ProductCategory } from '../types';

export interface SeedProductDef {
  id: string;
  name: string;
  category: ProductCategory;
  priceRupiah: number;
}

export const INITIAL_SEED_PRODUCTS: SeedProductDef[] = [
  { id: 'air-mineral', name: 'Air Mineral', category: 'Minuman', priceRupiah: 4000 },
  { id: 'teh-hangat', name: 'Teh Hangat', category: 'Minuman', priceRupiah: 4000 },
  { id: 'es-teh', name: 'Es Teh', category: 'Minuman', priceRupiah: 4000 },
  { id: 'kopi-cangkir', name: 'Kopi Cangkir', category: 'Minuman', priceRupiah: 5000 },
  { id: 'kopi-gelas', name: 'Kopi Gelas', category: 'Minuman', priceRupiah: 6000 },
  { id: 'kopi-susu-cangkir', name: 'Kopi Susu Cangkir', category: 'Minuman', priceRupiah: 6000 },
  { id: 'kopi-susu-gelas', name: 'Kopi Susu Gelas', category: 'Minuman', priceRupiah: 7000 },
  { id: 'jahe-geprek', name: 'Jahe Geprek', category: 'Minuman', priceRupiah: 5000 },
  { id: 'kapal-api', name: 'Kapal Api', category: 'Minuman', priceRupiah: 5000 },
  { id: 'white-coffee', name: 'White Coffee', category: 'Minuman', priceRupiah: 5000 },
  { id: 'tora-moka', name: 'Tora Moka', category: 'Minuman', priceRupiah: 5000 },
  { id: 'tora-susu', name: 'Tora Susu', category: 'Minuman', priceRupiah: 5000 },
  { id: 'extra-joss', name: 'Extra Joss', category: 'Minuman', priceRupiah: 5000 },
  { id: 'kukubima', name: 'Kukubima', category: 'Minuman', priceRupiah: 5000 },
  { id: 'hemaviton-jreng', name: 'Hemaviton Jreng', category: 'Minuman', priceRupiah: 5000 },
  { id: 'pop-ice', name: 'Pop Ice', category: 'Minuman', priceRupiah: 5000 },
  { id: 'nutrisari', name: 'Nutrisari', category: 'Minuman', priceRupiah: 5000 },
  { id: 'es-sirup', name: 'Es Sirup', category: 'Minuman', priceRupiah: 5000 },
  { id: 'mie-instan', name: 'Mie Instan', category: 'Makanan', priceRupiah: 6000 },
  { id: 'kopi-jahe-cangkir', name: 'Kopi Jahe Cangkir', category: 'Minuman', priceRupiah: 6000 },
  { id: 'kopi-jahe-gelas', name: 'Kopi Jahe Gelas', category: 'Minuman', priceRupiah: 7000 },
  { id: 'susu-jahe', name: 'Susu Jahe', category: 'Minuman', priceRupiah: 6000 },
  { id: 'good-day', name: 'Good Day', category: 'Minuman', priceRupiah: 6000 },
  { id: 'sido-muncul', name: 'Sido Muncul', category: 'Minuman', priceRupiah: 6000 },
  { id: 'indocafe', name: 'Indocafe', category: 'Minuman', priceRupiah: 6000 },
  { id: 'tora-cafe', name: 'Tora Cafe', category: 'Minuman', priceRupiah: 6000 },
  { id: 'energen', name: 'Energen', category: 'Minuman', priceRupiah: 6000 },
  { id: 'chocolatos', name: 'Chocolatos', category: 'Minuman', priceRupiah: 6000 },
  { id: 'drink-beng-beng', name: 'Drink Beng-Beng', category: 'Minuman', priceRupiah: 6000 },
  { id: 'milo', name: 'Milo', category: 'Minuman', priceRupiah: 6000 },
  { id: 'abc-klepon', name: 'ABC Klepon', category: 'Minuman', priceRupiah: 6000 },
  { id: 'bonteh', name: 'Bonteh', category: 'Minuman', priceRupiah: 6000 },
  { id: 'jhosua', name: 'Jhosua', category: 'Minuman', priceRupiah: 7000 },
  { id: 'kukubima-susu', name: 'Kukubima Susu', category: 'Minuman', priceRupiah: 7000 },
  { id: 'jreng-susu', name: 'Jreng Susu', category: 'Minuman', priceRupiah: 7000 },
  { id: 'soda-gembira', name: 'Soda Gembira', category: 'Minuman', priceRupiah: 12000 },
  { id: 'mie-telur', name: 'Mie + Telur', category: 'Makanan', priceRupiah: 9000 },
];

export function createSeedProducts(nowIso = new Date().toISOString()): Product[] {
  return INITIAL_SEED_PRODUCTS.map((item) => ({
    ...item,
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}

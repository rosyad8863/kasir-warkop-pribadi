import type { CartItem, Product, TransactionItem } from '../types';
import { calculateLineSubtotal } from './money';

export function addProductToCart(cart: CartItem[], product: Product): CartItem[] {
  const existingIndex = cart.findIndex((item) => item.productId === product.id);
  if (existingIndex === -1) {
    return [
      ...cart,
      {
        productId: product.id,
        name: product.name,
        unitPriceRupiah: product.priceRupiah,
        quantity: 1,
      },
    ];
  }

  return cart.map((item, idx) =>
    idx === existingIndex
      ? {
          ...item,
          name: product.name,
          unitPriceRupiah: product.priceRupiah,
          quantity: item.quantity + 1,
        }
      : item
  );
}

export function updateCartItemQuantity(
  cart: CartItem[],
  productId: string,
  delta: number
): CartItem[] {
  return cart
    .map((item) =>
      item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
    )
    .filter((item) => item.quantity > 0);
}

export function setCartItemQuantity(
  cart: CartItem[],
  productId: string,
  quantity: number
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return cart.filter((item) => item.productId !== productId);
  }
  return cart.map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );
}

export function removeCartItem(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((item) => item.productId !== productId);
}

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce(
    (sum, item) => sum + calculateLineSubtotal(item.quantity, item.unitPriceRupiah),
    0
  );
}

export function calculateCartTotalItems(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function buildTransactionItemsSnapshot(cart: CartItem[]): TransactionItem[] {
  return cart.map((item) => ({
    productId: item.productId,
    productNameSnapshot: item.name,
    unitPriceSnapshotRupiah: item.unitPriceRupiah,
    quantity: item.quantity,
    subtotalRupiah: calculateLineSubtotal(item.quantity, item.unitPriceRupiah),
  }));
}

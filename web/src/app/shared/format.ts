import { Product } from '../api/api.models';

const pounds = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

/** 3500 → "£35.00". Prices travel as whole pence to avoid rounding errors. */
export function formatPrice(pence: number): string {
  return pounds.format(pence / 100);
}

/** How soon a product can arrive, in words. */
export function deliveryText(product: Pick<Product, 'in_stock' | 'lead_time_days'>): string {
  if (!product.in_stock) return 'Out of stock';
  const days = product.lead_time_days;
  if (days === 0) return 'Next-day delivery';
  return `Made to order: ${days} extra ${days === 1 ? 'day' : 'days'}`;
}

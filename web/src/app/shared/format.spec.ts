import { deliveryText, formatPrice } from './format';

describe('formatPrice', () => {
  it('formats whole pence as pounds', () => {
    expect(formatPrice(3500)).toBe('£35.00');
    expect(formatPrice(1899)).toBe('£18.99');
    expect(formatPrice(0)).toBe('£0.00');
  });
});

describe('deliveryText', () => {
  it('says out of stock in words', () => {
    expect(deliveryText({ in_stock: false, lead_time_days: 0 })).toBe('Out of stock');
  });

  it('describes lead times', () => {
    expect(deliveryText({ in_stock: true, lead_time_days: 0 })).toBe('Next-day delivery');
    expect(deliveryText({ in_stock: true, lead_time_days: 1 })).toBe('Made to order: 1 extra day');
    expect(deliveryText({ in_stock: true, lead_time_days: 2 })).toBe('Made to order: 2 extra days');
  });
});

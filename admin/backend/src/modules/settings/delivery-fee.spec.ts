import { deliveryFeeFor, DeliverySettings } from './delivery-fee';

const settings = (
  fee: number,
  freeShippingThreshold: number,
): DeliverySettings => ({
  fee,
  freeShippingThreshold,
});

describe('deliveryFeeFor', () => {
  it('charges the flat fee when subtotal is below the threshold', () => {
    expect(deliveryFeeFor(250, settings(8, 300))).toBe(8);
  });

  it('waives the fee exactly at the threshold', () => {
    expect(deliveryFeeFor(300, settings(8, 300))).toBe(0);
  });

  it('waives the fee above the threshold', () => {
    expect(deliveryFeeFor(999, settings(8, 300))).toBe(0);
  });

  it('always charges when the threshold is 0 (free shipping disabled)', () => {
    expect(deliveryFeeFor(100000, settings(8, 0))).toBe(8);
  });

  it('returns 0 when the fee itself is 0', () => {
    expect(deliveryFeeFor(10, settings(0, 300))).toBe(0);
  });
});

import { allocatePackPrice } from './pack-allocation';

describe('allocatePackPrice', () => {
  it('sums exactly to the pack price', () => {
    const shares = allocatePackPrice(100, [
      { productId: 'a', quantity: 1, unitPrice: 33.33 },
      { productId: 'b', quantity: 2, unitPrice: 33.33 },
      { productId: 'c', quantity: 1, unitPrice: 10 },
    ]);
    expect(shares.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 10);
    expect(shares[1]).toBeGreaterThan(shares[0]);
  });

  it('splits by quantity when all prices are zero', () => {
    expect(
      allocatePackPrice(30, [
        { productId: 'a', quantity: 1, unitPrice: 0 },
        { productId: 'b', quantity: 2, unitPrice: 0 },
      ]),
    ).toEqual([10, 20]);
  });
});

import { BadRequestException } from '@nestjs/common';
import { assertTransition, combineQuantities } from './stock-policy';

describe('order stock policy', () => {
  it('aggregates repeated products in stable locking order', () => {
    expect(
      combineQuantities([
        { productId: 'b', quantity: 2 },
        { productId: 'a', quantity: 1 },
        { productId: 'b', quantity: 3 },
      ]),
    ).toEqual([
      { productId: 'a', quantity: 1 },
      { productId: 'b', quantity: 5 },
    ]);
  });
  it('permits retries and normal fulfilment, and terminal cancellation', () => {
    expect(() => assertTransition('CONFIRMED', 'CONFIRMED')).not.toThrow();
    expect(() => assertTransition('PENDING', 'CONFIRMED')).not.toThrow();
    expect(() => assertTransition('SHIPPED', 'CANCELLED')).not.toThrow();
    expect(() => assertTransition('CANCELLED', 'CONFIRMED')).toThrow(
      BadRequestException,
    );
    expect(() => assertTransition('PENDING', 'SHIPPED')).toThrow(
      BadRequestException,
    );
    expect(() => assertTransition('DELIVERED', 'PENDING')).toThrow(
      BadRequestException,
    );
  });
});

import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export function combineQuantities(
  items: { productId: string | null; quantity: number }[],
) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item.productId)
      throw new BadRequestException({
        message: 'Order product is no longer available',
        code: 'PRODUCT_UNAVAILABLE',
      });
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }
  return [...quantities]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([productId, quantity]) => ({ productId, quantity }));
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  const next: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['CANCELLED'],
    CANCELLED: [],
  };
  if (from !== to && !next[from].includes(to))
    throw new BadRequestException({
      message: 'Invalid order status transition',
      code: 'INVALID_ORDER_TRANSITION',
    });
}

import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { OrdersRepository } from '../orders/orders.repository';
import { InventoryService } from './inventory.service';

// Explicit opt-in: creates uniquely named fixtures in the configured MySQL DB,
// cleans only their rows, and never alters existing products/orders/balances.
const databaseTest =
  process.env.RUN_INVENTORY_DB_TESTS === '1' ? describe : describe.skip;
databaseTest('inventory transactions (real MySQL)', () => {
  const prisma = new PrismaService();
  const inventory = new InventoryService(prisma);
  const orders = new OrdersService(
    new OrdersRepository(prisma),
    prisma,
    inventory,
  );
  const prefix = `stock-test-${randomUUID()}`;
  const productIds: string[] = [];
  let actorId: string;
  beforeAll(async () => {
    await prisma.$connect();
    actorId = (await prisma.user.findFirstOrThrow()).id;
  });
  afterAll(async () => {
    const fixtures = await prisma.order.findMany({
      where: { customerName: prefix },
      select: { id: true },
    });
    const ids = fixtures.map((o) => o.id);
    await prisma.stockMovement.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.orderInventory.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.inventoryItem.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await prisma.auditLog.deleteMany({
      where: { entityId: { in: [...ids, ...productIds] } },
    });
    await prisma.$disconnect();
  });
  const product = async (quantity: number) => {
    const p = await prisma.product.create({
      data: {
        slug: `${prefix}-${productIds.length}`,
        nameAr: 'اختبار',
        nameFr: 'Test',
        price: 10,
        inventory: { create: { quantity } },
      },
    });
    productIds.push(p.id);
    return p.id;
  };
  const order = (productId: string, quantity = 1) =>
    orders.create(
      { customerName: prefix, items: [{ productId, quantity }] },
      actorId,
    );
  const balance = async (productId: string) =>
    (await prisma.inventoryItem.findUniqueOrThrow({ where: { productId } }))
      .quantity;

  it('allows only one of two competing confirmations to consume the final unit', async () => {
    const p = await product(1);
    const [a, b] = await Promise.all([order(p), order(p)]);
    const result = await Promise.allSettled([
      orders.update(a.id, { status: 'CONFIRMED' }, actorId),
      orders.update(b.id, { status: 'CONFIRMED' }, actorId),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await balance(p)).toBe(0);
    expect(
      await prisma.stockMovement.count({
        where: { productId: p, kind: 'DEDUCTION' },
      }),
    ).toBe(1);
    expect(
      await prisma.order.count({
        where: { id: { in: [a.id, b.id] }, status: 'PENDING' },
      }),
    ).toBe(1);
  });
  it('deducts and restores once under simultaneous same-order retries', async () => {
    const p = await product(7);
    const o = await order(p, 3);
    await Promise.all(
      Array.from({ length: 4 }, () =>
        orders.update(o.id, { status: 'CONFIRMED' }, actorId),
      ),
    );
    expect(await balance(p)).toBe(4);
    await Promise.all(
      Array.from({ length: 4 }, () =>
        orders.update(o.id, { status: 'CANCELLED' }, actorId),
      ),
    );
    expect(await balance(p)).toBe(7);
    expect(await prisma.stockMovement.count({ where: { orderId: o.id } })).toBe(
      2,
    );
    await expect(orders.update(o.id, { status: 'CONFIRMED' })).rejects.toThrow(
      'Invalid order status transition',
    );
  });
  it('deducts on direct confirmed creation, combining duplicate product lines', async () => {
    const p = await product(8);
    const o = await orders.create(
      {
        customerName: prefix,
        status: 'CONFIRMED',
        items: [
          { productId: p, quantity: 2 },
          { productId: p, quantity: 3 },
        ],
      },
      actorId,
    );
    expect(o.stockState).toBe('DEDUCTED');
    expect(await balance(p)).toBe(3);
    expect(
      await prisma.stockMovement.count({
        where: { orderId: o.id, kind: 'DEDUCTION' },
      }),
    ).toBe(1);
    expect(
      (await prisma.orderItem.findMany({ where: { orderId: o.id } })).map(
        (i) => i.quantity,
      ),
    ).toEqual([2, 3]);
  });
  it('deduplicates simultaneous confirmed creation retries with one key and rejects changed payloads', async () => {
    const p = await product(5);
    const key = randomUUID();
    const dto = {
      customerName: prefix,
      status: 'CONFIRMED' as const,
      items: [{ productId: p, quantity: 2 }],
    };
    const result = await Promise.all(
      Array.from({ length: 4 }, () => orders.create(dto, actorId, key)),
    );
    expect(new Set(result.map((o) => o.id)).size).toBe(1);
    const reordered = await orders.create(
      {
        items: [{ quantity: 2, productId: p }],
        status: 'CONFIRMED',
        customerName: prefix,
      },
      actorId,
      key,
    );
    expect(reordered.id).toBe(result[0].id);
    expect(result.every((o) => o.stockState === 'DEDUCTED')).toBe(true);
    expect(await balance(p)).toBe(3);
    expect(await prisma.stockMovement.count({ where: { productId: p } })).toBe(
      1,
    );
    await expect(
      orders.create(
        { ...dto, items: [{ productId: p, quantity: 3 }] },
        actorId,
        key,
      ),
    ).rejects.toThrow('Idempotency key was already used');
    expect(await balance(p)).toBe(3);
  });

  it('rolls back all lines, status, movements and the new order when one product is short', async () => {
    const p = await product(5);
    const q = await product(0);
    const before = await prisma.order.count({
      where: { customerName: prefix },
    });
    await expect(
      orders.create(
        {
          customerName: prefix,
          status: 'CONFIRMED',
          items: [
            { productId: p, quantity: 2 },
            { productId: q, quantity: 1 },
          ],
        },
        actorId,
      ),
    ).rejects.toThrow('Insufficient stock');
    expect(await balance(p)).toBe(5);
    expect(await prisma.stockMovement.count({ where: { productId: p } })).toBe(
      0,
    );
    expect(await prisma.order.count({ where: { customerName: prefix } })).toBe(
      before,
    );
  });
  it('does not deduct or restore legacy orders or cancellation of unconfirmed orders', async () => {
    const p = await product(5);
    const o = await order(p, 2);
    await prisma.orderInventory.update({
      where: { orderId: o.id },
      data: { state: 'LEGACY' },
    });
    await orders.update(o.id, { status: 'CONFIRMED' }, actorId);
    await orders.update(o.id, { status: 'CANCELLED' }, actorId);
    const pending = await order(p, 3);
    await orders.update(pending.id, { status: 'CANCELLED' }, actorId);
    expect(await balance(p)).toBe(5);
    expect(await prisma.stockMovement.count({ where: { productId: p } })).toBe(
      0,
    );
  });
  it('serializes concurrent adjustments and rejects negative stock with no partial audit', async () => {
    const p = await product(5);
    const results = await Promise.allSettled([
      inventory.adjust(p, { delta: -4, reason: 'Damaged' }, actorId),
      inventory.adjust(p, { delta: -4, reason: 'Damaged' }, actorId),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await balance(p)).toBe(1);
    expect(await prisma.stockMovement.count({ where: { productId: p } })).toBe(
      1,
    );
    expect(
      await prisma.auditLog.count({
        where: { entityId: p, action: 'inventory.adjusted' },
      }),
    ).toBe(1);
  });
  it('keeps snapshots immutable and refunds do not restore physical stock', async () => {
    const p = await product(5);
    const o = await order(p, 2);
    await orders.update(o.id, { status: 'CONFIRMED' }, actorId);
    await prisma.product.update({
      where: { id: p },
      data: { price: 999, nameFr: 'Changed' },
    });
    await orders.update(o.id, { paymentStatus: 'REFUNDED' }, actorId);
    expect(await balance(p)).toBe(3);
    const detail = await orders.findOne(o.id);
    expect(detail.items[0].productNameFr).toBe('Test');
    expect(detail.items[0].productPrice).toBe(10);
  });
});

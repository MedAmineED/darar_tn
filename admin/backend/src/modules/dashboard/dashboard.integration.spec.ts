import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

// Opt-in because this exercises MySQL 8 CTEs and requires the inventory migration.
// All fixtures have unique IDs and are removed in afterAll, including on failure.
const describeDatabase =
  process.env.RUN_DASHBOARD_INTEGRATION === '1' ? describe : describe.skip;

describeDatabase('dashboard database reporting policy', () => {
  const prisma = new PrismaService();
  const repository = new DashboardRepository(prisma);
  const service = new DashboardService(repository);
  const prefix = `000-dashboard-test-${randomUUID()}`;
  const productIds = [`${prefix}-low`, `${prefix}-out`, `${prefix}-healthy`];
  const orderIds: string[] = [];
  const range = { from: '2091-01-10', to: '2091-01-11' };

  afterAll(async () => {
    if (process.env.RUN_DASHBOARD_INTEGRATION !== '1') return;
    await prisma.stockMovement.deleteMany({
      where: {
        OR: [{ orderId: { in: orderIds } }, { productId: { in: productIds } }],
      },
    });
    await prisma.orderInventory.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.inventoryItem.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await prisma.$disconnect();
  });

  it('counts all orders but only paid non-cancelled revenue/sales, using Tunis inclusive boundaries and snapshots', async () => {
    const baseline = await service.getStats(range);
    for (let index = 0; index < productIds.length; index += 1) {
      await prisma.product.create({
        data: {
          id: productIds[index],
          slug: productIds[index],
          nameAr: 'اسم الكتالوج الحالي',
          nameFr: 'Catalogue actuel',
          price: 100,
          inventory: {
            create: {
              quantity: [2, 0, 5][index],
              lowStockThreshold: [2, 0, 2][index],
            },
          },
        },
      });
    }
    async function order(
      status: OrderStatus,
      paymentStatus: PaymentStatus,
      amount: number,
      quantity: number,
      createdAt: string,
      name = 'لقطة قديمة',
    ) {
      const id = `${prefix}-${orderIds.length}`;
      orderIds.push(id);
      return prisma.order.create({
        data: {
          id,
          orderNumber: id,
          customerName: prefix,
          inventory: { create: { state: 'LEGACY' } },
          status,
          paymentStatus,
          subtotal: amount + 10,
          discountAmount: 20,
          shippingAmount: 10,
          totalAmount: amount,
          createdAt: new Date(createdAt),
          items: {
            create: {
              productId: productIds[0],
              productNameAr: name,
              productNameFr:
                name === 'لقطة حديثة' ? 'Snapshot récent' : 'Snapshot ancien',
              productPrice: 100,
              quantity,
              total: quantity * 100,
            },
          },
        },
      });
    }
    // First exact Tunis midnight and last millisecond of the inclusive final day.
    await order('CONFIRMED', 'PAID', 90, 2, '2091-01-09T23:00:00.000Z');
    await order(
      'DELIVERED',
      'PAID',
      200,
      3,
      '2091-01-11T22:59:59.999Z',
      'لقطة حديثة',
    );
    await order('CANCELLED', 'PAID', 300, 20, '2091-01-10T10:00:00.000Z');
    for (const status of ['PENDING', 'FAILED', 'REFUNDED'] as const) {
      await order('DELIVERED', status, 400, 20, '2091-01-10T10:00:00.000Z');
    }
    // Outside both inclusive limits: before start belongs to previous period.
    await order('CONFIRMED', 'PAID', 50, 1, '2091-01-09T22:59:59.999Z');
    await order('CONFIRMED', 'PAID', 900, 40, '2091-01-11T23:00:00.000Z');

    const result = await service.getStats(range);
    expect(result.kpis.orders.value - baseline.kpis.orders.value).toBe(6);
    expect(result.kpis.revenue.value - baseline.kpis.revenue.value).toBe(290);
    expect(result.kpis.paidOrders - baseline.kpis.paidOrders).toBe(2);
    expect(result.kpis.unitsSold.value - baseline.kpis.unitsSold.value).toBe(5);
    expect(
      result.kpis.revenue.previousValue - baseline.kpis.revenue.previousValue,
    ).toBe(50);
    expect(result.kpis.averageOrderValue.value).toBe(
      result.kpis.revenue.value / result.kpis.paidOrders,
    );
    expect(result.daily).toHaveLength(2);
    expect(result.daily[0].revenue - baseline.daily[0].revenue).toBe(90);
    expect(result.daily[1].revenue - baseline.daily[1].revenue).toBe(200);
    const ranked = result.topProducts.filter(
      (product) => product.productId === productIds[0],
    );
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({
      quantity: 5,
      grossRevenue: 500,
      nameAr: 'لقطة حديثة',
      nameFr: 'Snapshot récent',
    });
    expect(result.inventory.lowStock).toBeGreaterThanOrEqual(1);
    expect(result.inventory.outOfStock).toBeGreaterThanOrEqual(1);
    expect(
      result.inventory.alerts.find((item) => item.productId === productIds[1]),
    ).toMatchObject({ quantity: 0, lowStockThreshold: 0 });
    expect(result.recentOrders.map((item) => item.id)).toContain(orderIds[0]);
    expect(result.recentOrders.map((item) => item.id)).not.toContain(
      orderIds[7],
    );
    expect(
      result.ordersByPaymentStatus.PAID - baseline.ordersByPaymentStatus.PAID,
    ).toBe(3);
  }, 30_000);
});

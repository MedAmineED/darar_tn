import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

const fixture = (): Awaited<ReturnType<DashboardRepository['read']>> => ({
  current: {
    orders: 8,
    revenue: new Prisma.Decimal('290.00'),
    paidOrders: 2,
    unitsSold: 5,
    newCustomers: 3,
  },
  previous: {
    orders: 4,
    revenue: new Prisma.Decimal('100.00'),
    paidOrders: 4,
    unitsSold: 0,
    newCustomers: 0,
  },
  daily: [
    { date: '2026-10-15', revenue: new Prisma.Decimal('290.00'), orders: 8 },
  ],
  statuses: [
    { status: 'PENDING', _count: { _all: 3 } },
    { status: 'CONFIRMED', _count: { _all: 5 } },
  ],
  payments: [{ paymentStatus: 'PAID', _count: { _all: 2 } }],
  recent: [
    {
      id: 'order-id',
      orderNumber: 'ORDER-1',
      customerName: 'عميل',
      totalAmount: new Prisma.Decimal('90.00'),
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      createdAt: new Date('2026-10-15T12:00:00Z'),
    },
  ],
  topProducts: [
    {
      key: 'product-id',
      productId: 'product-id',
      nameAr: 'اسم وقت البيع',
      nameFr: 'Nom à la vente',
      sku: 'SKU',
      quantity: 5n,
      grossRevenue: new Prisma.Decimal('300.00'),
    },
  ],
  inventory: {
    trackedProducts: 3n,
    untrackedProducts: 1n,
    lowStock: 1n,
    outOfStock: 1n,
  },
  alerts: [
    {
      productId: 'product-id',
      nameAr: 'منتج',
      nameFr: 'Produit',
      sku: 'SKU',
      quantity: 0,
      lowStockThreshold: 3,
    },
  ],
  activeProducts: 4,
});

describe('DashboardService', () => {
  const repository = new DashboardRepository(new PrismaService());
  const service = new DashboardService(repository);
  afterEach(() => jest.restoreAllMocks());

  it('uses eligible paid-order count for average value and preserves snapshots and IDs', async () => {
    jest.spyOn(repository, 'read').mockResolvedValue(fixture());
    const result = await service.getStats({
      from: '2026-10-15',
      to: '2026-10-16',
    });
    expect(result.kpis.averageOrderValue).toEqual({
      value: 145,
      previousValue: 25,
      changePercent: 480,
    });
    expect(result.kpis.unitsSold).toEqual({
      value: 5,
      previousValue: 0,
      changePercent: null,
    });
    expect(result.kpis.newCustomers.changePercent).toBeNull();
    expect(result.ordersByStatus.CANCELLED).toBe(0);
    expect(result.ordersByStatus.PENDING).toBe(3);
    expect(result.ordersByPaymentStatus.REFUNDED).toBe(0);
    expect(result.daily).toEqual([
      { date: '2026-10-15', revenue: 290, orders: 8 },
      { date: '2026-10-16', revenue: 0, orders: 0 },
    ]);
    expect(result.topProducts[0]).toMatchObject({
      nameAr: 'اسم وقت البيع',
      nameFr: 'Nom à la vente',
      quantity: 5,
      grossRevenue: 300,
    });
    expect(result.recentOrders[0]).toMatchObject({
      id: 'order-id',
      totalAmount: 90,
    });
    expect(result.inventory.lowStock).toBe(1);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('returns zero average for an empty eligible cohort and rejects invalid ranges before DB access', async () => {
    const data = fixture();
    data.current = {
      orders: 1,
      revenue: 0,
      paidOrders: 0,
      unitsSold: 0,
      newCustomers: 0,
    };
    const read = jest.spyOn(repository, 'read').mockResolvedValue(data);
    const result = await service.getStats({
      from: '2026-10-15',
      to: '2026-10-16',
    });
    expect(result.kpis.averageOrderValue.value).toBe(0);
    read.mockClear();
    await expect(service.getStats({ from: '2026-10-15' })).rejects.toThrow();
    expect(read).not.toHaveBeenCalled();
  });
});

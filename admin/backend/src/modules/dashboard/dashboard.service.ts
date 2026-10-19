import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { DashboardRepository, type SummaryRow } from './dashboard.repository';
import {
  comparisonMetric,
  dailySeries,
  reportingWindow,
  type ReportingQuery,
} from './period';

const averageOrderValue = (summary: SummaryRow): number => {
  const count = Number(summary.paidOrders);
  return count > 0
    ? Math.round((Number(summary.revenue) / count) * 100) / 100
    : 0;
};

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getStats(query: ReportingQuery) {
    const window = reportingWindow(query);
    const data = await this.repository.read(window);
    const metric = (key: 'orders' | 'revenue' | 'unitsSold' | 'newCustomers') =>
      comparisonMetric(Number(data.current[key]), Number(data.previous[key]));
    const ordersByStatus = Object.fromEntries(
      Object.values(OrderStatus).map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    const ordersByPaymentStatus = Object.fromEntries(
      Object.values(PaymentStatus).map((status) => [status, 0]),
    ) as Record<PaymentStatus, number>;
    for (const group of data.statuses)
      ordersByStatus[group.status] = group._count._all;
    for (const group of data.payments)
      ordersByPaymentStatus[group.paymentStatus] = group._count._all;

    return {
      range: {
        from: window.from,
        to: window.to,
        days: window.days,
        previousFrom: window.previousFrom,
        previousTo: window.previousTo,
        timezone: 'Africa/Tunis',
      },
      kpis: {
        orders: metric('orders'),
        revenue: metric('revenue'),
        unitsSold: metric('unitsSold'),
        newCustomers: metric('newCustomers'),
        averageOrderValue: comparisonMetric(
          averageOrderValue(data.current),
          averageOrderValue(data.previous),
        ),
        pendingOrders: ordersByStatus.PENDING,
        activeProducts: data.activeProducts,
        paidOrders: Number(data.current.paidOrders),
      },
      ordersByStatus,
      ordersByPaymentStatus,
      daily: dailySeries(
        window,
        data.daily.map((row) => ({
          date: row.date,
          orders: Number(row.orders),
          revenue: Number(row.revenue),
        })),
      ),
      topProducts: data.topProducts.map((row) => ({
        ...row,
        quantity: Number(row.quantity),
        grossRevenue: Number(row.grossRevenue),
      })),
      recentOrders: data.recent.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
      })),
      inventory: {
        trackedProducts: Number(data.inventory.trackedProducts),
        untrackedProducts: Number(data.inventory.untrackedProducts),
        lowStock: Number(data.inventory.lowStock),
        outOfStock: Number(data.inventory.outOfStock),
        alerts: data.alerts,
      },
    };
  }
}

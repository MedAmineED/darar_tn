import { apiClient, unwrap } from './client';
import type { ApiSuccess } from './types';
import type { OrderStatus, PaymentStatus } from './commerce-types';

export interface DashboardRange {
  from: string;
  to: string;
}

export interface ComparisonMetric {
  value: number;
  previousValue: number;
  changePercent: number | null;
}

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardStats {
  range: DashboardRange & {
    days: number;
    previousFrom: string;
    previousTo: string;
    timezone: string;
  };
  kpis: {
    orders: ComparisonMetric;
    revenue: ComparisonMetric;
    unitsSold: ComparisonMetric;
    averageOrderValue: ComparisonMetric;
    newCustomers: ComparisonMetric;
    pendingOrders: number;
    activeProducts: number;
    paidOrders: number;
  };
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  daily: DailyPoint[];
  topProducts: {
    key: string;
    productId: string | null;
    nameAr: string;
    nameFr: string;
    sku: string | null;
    quantity: number;
    grossRevenue: number;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }[];
  inventory: {
    trackedProducts: number;
    untrackedProducts: number;
    lowStock: number;
    outOfStock: number;
    alerts: {
      productId: string;
      nameAr: string;
      nameFr: string;
      sku: string | null;
      quantity: number;
      lowStockThreshold: number;
    }[];
  };
}

export async function getDashboardStats(
  range: DashboardRange,
): Promise<DashboardStats> {
  const res = await apiClient.get<ApiSuccess<DashboardStats>>(
    '/dashboard/stats',
    {
      params: range,
    },
  );
  return unwrap(res);
}

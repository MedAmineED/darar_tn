import { Injectable } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReportingWindow } from './period';

type SqlNumber = Prisma.Decimal | bigint | number;
export interface SummaryRow {
  orders: SqlNumber;
  revenue: SqlNumber;
  paidOrders: SqlNumber;
  unitsSold: SqlNumber;
  newCustomers: number;
}
interface DailyRow {
  date: string;
  orders: SqlNumber;
  revenue: SqlNumber;
}
interface TopProductRow {
  key: string;
  productId: string | null;
  nameAr: string;
  nameFr: string;
  sku: string | null;
  quantity: SqlNumber;
  grossRevenue: SqlNumber;
}
interface InventorySummaryRow {
  trackedProducts: SqlNumber;
  untrackedProducts: SqlNumber;
  lowStock: SqlNumber;
  outOfStock: SqlNumber;
}
export interface InventoryAlertRow {
  productId: string;
  nameAr: string;
  nameFr: string;
  sku: string | null;
  quantity: number;
  lowStockThreshold: number;
}

// Shared by every monetary/sales SQL aggregate: payment state alone is insufficient.
const eligible = Prisma.sql`o.paymentStatus = ${PaymentStatus.PAID} AND o.status <> ${OrderStatus.CANCELLED}`;

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  read(window: ReportingWindow) {
    return this.prisma.$transaction(
      async (tx) => {
        const createdAt = { gte: window.start, lt: window.end };
        const [
          current,
          previous,
          daily,
          statuses,
          payments,
          recent,
          topProducts,
          inventory,
          alerts,
          activeProducts,
        ] = await Promise.all([
          this.summary(tx, window.start, window.end),
          this.summary(tx, window.previousStart, window.previousEnd),
          tx.$queryRaw<DailyRow[]>(Prisma.sql`
            SELECT DATE_FORMAT(DATE_ADD(o.createdAt, INTERVAL 1 HOUR), '%Y-%m-%d') AS date,
              COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN ${eligible} THEN o.totalAmount ELSE 0 END), 0) AS revenue
            FROM orders o
            WHERE o.createdAt >= ${window.start} AND o.createdAt < ${window.end}
            GROUP BY date ORDER BY date ASC
          `),
          tx.order.groupBy({
            by: ['status'],
            where: { createdAt },
            _count: { _all: true },
          }),
          tx.order.groupBy({
            by: ['paymentStatus'],
            where: { createdAt },
            _count: { _all: true },
          }),
          tx.order.findMany({
            where: { createdAt },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 10,
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              totalAmount: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
            },
          }),
          this.topProducts(tx, window),
          tx.$queryRaw<InventorySummaryRow[]>(Prisma.sql`
            SELECT COUNT(i.productId) AS trackedProducts,
              COUNT(*) - COUNT(i.productId) AS untrackedProducts,
              COALESCE(SUM(CASE WHEN i.quantity > 0 AND i.quantity <= i.lowStockThreshold THEN 1 ELSE 0 END), 0) AS lowStock,
              COALESCE(SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END), 0) AS outOfStock
            FROM products p LEFT JOIN inventory_items i ON i.productId = p.id
          `),
          tx.$queryRaw<InventoryAlertRow[]>(Prisma.sql`
            SELECT i.productId, p.nameAr, p.nameFr, p.sku, i.quantity, i.lowStockThreshold
            FROM inventory_items i INNER JOIN products p ON p.id = i.productId
            WHERE i.quantity = 0 OR (i.quantity > 0 AND i.quantity <= i.lowStockThreshold)
            ORDER BY i.quantity ASC, p.id ASC LIMIT 8
          `),
          tx.product.count({ where: { status: ProductStatus.ACTIVE } }),
        ]);
        return {
          current,
          previous,
          daily,
          statuses,
          payments,
          recent,
          topProducts,
          inventory: inventory[0],
          alerts,
          activeProducts,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async summary(
    tx: Prisma.TransactionClient,
    start: Date,
    end: Date,
  ): Promise<SummaryRow> {
    const [rows, units, newCustomers] = await Promise.all([
      tx.$queryRaw<Omit<SummaryRow, 'unitsSold' | 'newCustomers'>[]>(Prisma.sql`
        SELECT COUNT(*) AS orders,
          COALESCE(SUM(CASE WHEN ${eligible} THEN o.totalAmount ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(CASE WHEN ${eligible} THEN 1 ELSE 0 END), 0) AS paidOrders
        FROM orders o WHERE o.createdAt >= ${start} AND o.createdAt < ${end}
      `),
      tx.$queryRaw<{ unitsSold: SqlNumber }[]>(Prisma.sql`
        SELECT COALESCE(SUM(oi.quantity), 0) AS unitsSold
        FROM orders o INNER JOIN order_items oi ON oi.orderId = o.id
        WHERE o.createdAt >= ${start} AND o.createdAt < ${end} AND ${eligible}
      `),
      tx.customer.count({ where: { createdAt: { gte: start, lt: end } } }),
    ]);
    return { ...rows[0], unitsSold: units[0].unitsSold, newCustomers };
  }

  private topProducts(tx: Prisma.TransactionClient, window: ReportingWindow) {
    // Live product IDs group renamed snapshots together. Deleted products have no
    // recoverable ID; keep their SKU/name snapshot identity instead of dropping sales.
    // ROW_NUMBER selects one paired AR/FR snapshot, without splitting by name.
    return tx.$queryRaw<TopProductRow[]>(Prisma.sql`
      WITH sales AS (
        SELECT oi.*, o.createdAt,
          COALESCE(oi.productId, CONCAT('snapshot:', COALESCE(oi.productSku, ''), CHAR(0), oi.productNameAr, CHAR(0), oi.productNameFr)) AS productKey
        FROM orders o INNER JOIN order_items oi ON oi.orderId = o.id
        WHERE o.createdAt >= ${window.start} AND o.createdAt < ${window.end} AND ${eligible}
      ), ranked AS (
        SELECT sales.*, ROW_NUMBER() OVER (PARTITION BY productKey ORDER BY createdAt DESC, id DESC) AS snapshotRank
        FROM sales
      )
      SELECT productKey AS \`key\`, MAX(productId) AS productId,
        MAX(CASE WHEN snapshotRank = 1 THEN productNameAr END) AS nameAr,
        MAX(CASE WHEN snapshotRank = 1 THEN productNameFr END) AS nameFr,
        MAX(CASE WHEN snapshotRank = 1 THEN productSku END) AS sku,
        SUM(quantity) AS quantity, SUM(total) AS grossRevenue
      FROM ranked GROUP BY productKey
      ORDER BY quantity DESC, grossRevenue DESC, productKey ASC LIMIT 10
    `);
  }
}

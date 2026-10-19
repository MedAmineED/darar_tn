import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { InventoryQueryDto, MovementQueryDto } from './dto/inventory-query.dto';
import { AdjustStockDto, ThresholdDto } from './dto/adjust-stock.dto';
import { combineQuantities } from './stock-policy';
import { stockTransaction } from './stock-transactions';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InventoryQueryDto) {
    const where: Prisma.InventoryItemWhereInput = {
      product: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.search
          ? {
              OR: [
                { nameAr: { contains: query.search } },
                { nameFr: { contains: query.search } },
                { sku: { contains: query.search } },
              ],
            }
          : {}),
      },
    };
    if (query.availability === 'OUT') where.quantity = 0;
    if (query.availability === 'LOW')
      where.quantity = {
        gt: 0,
        lte: this.prisma.inventoryItem.fields.lowStockThreshold,
      };
    if (query.availability === 'IN')
      where.quantity = {
        gt: this.prisma.inventoryItem.fields.lowStockThreshold,
      };
    const sortBy = query.sortBy ?? 'updatedAt';
    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = [
      'quantity',
      'lowStockThreshold',
      'updatedAt',
    ].includes(sortBy)
      ? { [sortBy]: query.sortOrder }
      : {
          product: {
            [sortBy === 'nameFr' ? 'nameFr' : 'nameAr']: query.sortOrder,
          },
        };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [orderBy, { productId: 'asc' }],
        include: {
          product: {
            select: { nameAr: true, nameFr: true, sku: true, status: true },
          },
        },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return buildPaginatedResult(
      items.map((item) => ({
        ...item,
        availability:
          item.quantity === 0
            ? 'OUT'
            : item.quantity <= item.lowStockThreshold
              ? 'LOW'
              : 'IN',
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async history(productId: string, query: MovementQueryDto) {
    const where: Prisma.StockMovementWhereInput = {
      productId,
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.search
        ? {
            OR: [
              { reason: { contains: query.search } },
              { orderId: { contains: query.search } },
              { actorId: { contains: query.search } },
            ],
          }
        : {}),
    };
    const sortBy = ['createdAt', 'delta', 'balanceAfter'].includes(
      query.sortBy ?? '',
    )
      ? query.sortBy!
      : 'createdAt';
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ [sortBy]: query.sortOrder }, { id: 'desc' }],
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async adjust(productId: string, dto: AdjustStockDto, actorId: string) {
    return stockTransaction(this.prisma, (tx) =>
      this.adjustInTransaction(tx, productId, dto, actorId),
    );
  }

  /** Shares the caller's transaction so product creation and opening stock commit together. */
  async adjustInTransaction(
    tx: Prisma.TransactionClient,
    productId: string,
    dto: AdjustStockDto,
    actorId: string,
  ) {
    await this.lockStock(tx, productId);
    const changed = await tx.inventoryItem.updateMany({
      where: {
        productId,
        quantity: {
          gte: Math.max(0, -dto.delta),
          lte: 2147483647 - Math.max(0, dto.delta),
        },
      },
      data: {
        quantity: { increment: dto.delta },
        lowStockThreshold: dto.lowStockThreshold,
      },
    });
    if (!changed.count)
      throw new ConflictException({
        message: 'Stock cannot be negative or exceed its limit',
        code: 'INVALID_STOCK_BALANCE',
      });
    const item = await tx.inventoryItem.findUniqueOrThrow({
      where: { productId },
      include: { product: true },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        kind: 'ADJUSTMENT',
        delta: dto.delta,
        balanceAfter: item.quantity,
        reason: dto.reason,
        actorId,
        productNameAr: item.product.nameAr,
        productNameFr: item.product.nameFr,
        productSku: item.product.sku,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'inventory.adjusted',
        entity: 'InventoryItem',
        entityId: productId,
        metadata: {
          delta: dto.delta,
          reason: dto.reason,
          balanceAfter: item.quantity,
          lowStockThreshold: item.lowStockThreshold,
        },
      },
    });
    return {
      productId,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
    };
  }

  async threshold(productId: string, dto: ThresholdDto, actorId: string) {
    return stockTransaction(this.prisma, (tx) =>
      this.thresholdInTransaction(tx, productId, dto, actorId),
    );
  }

  async thresholdInTransaction(
    tx: Prisma.TransactionClient,
    productId: string,
    dto: ThresholdDto,
    actorId: string,
  ) {
    await this.lockStock(tx, productId);
    const before = await tx.inventoryItem.findUniqueOrThrow({
      where: { productId },
    });
    const item = await tx.inventoryItem.update({
      where: { productId },
      data: { lowStockThreshold: dto.lowStockThreshold },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'inventory.threshold_changed',
        entity: 'InventoryItem',
        entityId: productId,
        metadata: {
          before: before.lowStockThreshold,
          after: dto.lowStockThreshold,
          reason: dto.reason,
        },
      },
    });
    return item;
  }

  /** Called inside the locked order transaction only. Ledger/state and balance commit together. */
  async moveOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    kind: 'DEDUCTION' | 'RESTORATION',
    items: { productId: string | null; quantity: number }[],
    actorId?: string,
  ) {
    const lines =
      kind === 'DEDUCTION'
        ? combineQuantities(items)
        : (
            await tx.stockMovement.findMany({
              where: { orderId, kind: StockMovementKind.DEDUCTION },
              orderBy: { productId: 'asc' },
            })
          ).map((m) => ({ productId: m.productId, quantity: -m.delta }));
    for (const line of lines) {
      await this.lockStock(tx, line.productId);
      const delta = kind === 'DEDUCTION' ? -line.quantity : line.quantity;
      const result = await tx.inventoryItem.updateMany({
        where: {
          productId: line.productId,
          quantity: {
            gte: Math.max(0, -delta),
            lte: 2147483647 - Math.max(0, delta),
          },
        },
        data: { quantity: { increment: delta } },
      });
      if (!result.count)
        throw new ConflictException({
          message: 'Insufficient stock for one or more products',
          code: 'INSUFFICIENT_STOCK',
        });
      const item = await tx.inventoryItem.findUniqueOrThrow({
        where: { productId: line.productId },
        include: { product: true },
      });
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          orderId,
          kind,
          delta,
          balanceAfter: item.quantity,
          actorId,
          reason: kind === 'DEDUCTION' ? 'Order confirmed' : 'Order cancelled',
          productNameAr: item.product.nameAr,
          productNameFr: item.product.nameFr,
          productSku: item.product.sku,
        },
      });
    }
    await tx.orderInventory.update({
      where: { orderId },
      data: { state: kind === 'DEDUCTION' ? 'DEDUCTED' : 'RESTORED' },
    });
  }

  private async lockStock(tx: Prisma.TransactionClient, productId: string) {
    const rows = await tx.$queryRaw<
      { productId: string }[]
    >`SELECT productId FROM inventory_items WHERE productId = ${productId} FOR UPDATE`;
    if (!rows.length)
      throw new NotFoundException({
        message: 'Inventory product not found',
        code: 'INVENTORY_NOT_FOUND',
      });
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { OrderStatus, Prisma } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { assertTransition } from '../inventory/stock-policy';
import { stockTransaction } from '../inventory/stock-transactions';
import { orderDetailInclude } from './orders.repository';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { hashOrderRequest } from './order-request';
import { allocatePackPrice } from './pack-allocation';
import { generateOrderNumber } from './order-number.util';
import {
  OrderResponse,
  toOrderListItem,
  toOrderResponse,
} from './order.mapper';
import { OrdersRepository } from './orders.repository';

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface BuiltItem {
  productId: string;
  productNameAr: string;
  productNameFr: string;
  productSku: string | null;
  productPrice: number;
  quantity: number;
  total: number;
  unitCost: number | null;
  packId: string | null;
  packNameAr: string | null;
  packNameFr: string | null;
}

interface ResolvedCustomer {
  connect?: Prisma.CustomerCreateNestedOneWithoutOrdersInput['connect'];
  name: string;
  phone: string | null;
  email: string | null;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async create(
    dto: CreateOrderDto,
    actorId?: string,
    requestKey?: string,
  ): Promise<OrderResponse> {
    if (requestKey !== undefined && !/^[A-Za-z0-9_-]{8,128}$/.test(requestKey))
      throw new BadRequestException({
        message: 'Invalid Idempotency-Key',
        code: 'INVALID_IDEMPOTENCY_KEY',
      });
    const creationKey = requestKey
      ? createHash('sha256')
          .update(`${actorId ?? 'system'}:${requestKey}`)
          .digest('hex')
      : undefined;
    const requestHash = creationKey ? hashOrderRequest(dto) : undefined;
    if (creationKey) {
      const previous = await this.creationRetry(creationKey, requestHash!);
      if (previous) return toOrderResponse(previous);
    }
    if (
      dto.status &&
      dto.status !== OrderStatus.PENDING &&
      dto.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException({
        message: 'New orders must start pending or confirmed',
        code: 'INVALID_INITIAL_STATUS',
      });
    }
    if (!dto.items?.length && !dto.packs?.length)
      throw new BadRequestException({
        message: 'An order needs at least one product or pack',
        code: 'ORDER_ITEMS_REQUIRED',
      });
    const customer = await this.resolveCustomer(dto);
    const items = [
      ...(await this.buildItems(dto.items ?? [])),
      ...(await this.buildPackItems(dto.packs ?? [])),
    ];

    const subtotal = round2(items.reduce((sum, item) => sum + item.total, 0));
    const discountAmount = dto.discountAmount ?? 0;
    const shippingAmount = dto.shippingAmount ?? 0;
    const totalAmount = round2(subtotal - discountAmount + shippingAmount);
    if (totalAmount < 0) {
      throw new BadRequestException({
        message: 'Discount cannot exceed the order total',
        code: 'INVALID_ORDER_TOTAL',
      });
    }

    const data: Omit<Prisma.OrderCreateInput, 'orderNumber'> = {
      customer: customer.connect ? { connect: customer.connect } : undefined,
      status: dto.status,
      paymentStatus: dto.paymentStatus,
      paymentMethod: dto.paymentMethod,
      subtotal: new Prisma.Decimal(subtotal),
      discountAmount: new Prisma.Decimal(discountAmount),
      shippingAmount: new Prisma.Decimal(shippingAmount),
      totalAmount: new Prisma.Decimal(totalAmount),
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      items: {
        create: items.map((item) => ({
          product: { connect: { id: item.productId } },
          productNameAr: item.productNameAr,
          productNameFr: item.productNameFr,
          productSku: item.productSku,
          productPrice: new Prisma.Decimal(item.productPrice),
          quantity: item.quantity,
          total: new Prisma.Decimal(item.total),
          unitCost:
            item.unitCost === null ? null : new Prisma.Decimal(item.unitCost),
          pack: item.packId ? { connect: { id: item.packId } } : undefined,
          packNameAr: item.packNameAr,
          packNameFr: item.packNameFr,
        })),
      },
    };

    const order = await this.createWithUniqueNumber(
      data,
      actorId,
      creationKey,
      requestHash,
    );
    return toOrderResponse(order);
  }

  async findAll(query: OrderQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.OrderWhereInput = {};
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { customerName: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.customerId) where.customerId = query.customerId;

    const [items, total] = await this.repository.findMany({
      skip: query.skip,
      take: query.limit,
      where,
      orderBy: { createdAt: query.sortOrder },
    });
    return buildPaginatedResult(
      items.map(toOrderListItem),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<OrderResponse> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException({
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }
    return toOrderResponse(order);
  }

  async update(
    id: string,
    dto: UpdateOrderDto,
    actorId?: string,
  ): Promise<OrderResponse> {
    return stockTransaction(this.prisma, async (tx) => {
      const locked = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;
      if (!locked.length)
        throw new NotFoundException({
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND',
        });
      const current = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { items: true, inventory: true },
      });
      if (!current.inventory)
        throw new BadRequestException({
          message: 'Order inventory state is missing',
          code: 'INVENTORY_STATE_MISSING',
        });
      const next = dto.status ?? current.status;
      assertTransition(current.status, next);
      if (next === 'CONFIRMED' && current.inventory.state === 'UNCOMMITTED') {
        await this.inventory.moveOrder(
          tx,
          id,
          'DEDUCTION',
          current.items,
          actorId,
        );
      }
      if (next === 'CANCELLED' && current.inventory.state === 'DEDUCTED') {
        await this.inventory.moveOrder(
          tx,
          id,
          'RESTORATION',
          current.items,
          actorId,
        );
      }
      const order = await tx.order.update({
        where: { id },
        data: {
          status: dto.status,
          paymentStatus: dto.paymentStatus,
          paymentMethod: dto.paymentMethod,
          shippingAddress: dto.shippingAddress,
          notes: dto.notes,
        },
        include: orderDetailInclude,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'order.updated',
          entity: 'Order',
          entityId: id,
          metadata: {
            previousStatus: current.status,
            status: next,
            paymentStatus: order.paymentStatus,
          },
        },
      });
      return toOrderResponse(order);
    });
  }

  private async resolveCustomer(
    dto: CreateOrderDto,
  ): Promise<ResolvedCustomer> {
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new BadRequestException({
          message: 'Selected customer does not exist',
          code: 'CUSTOMER_NOT_FOUND',
        });
      }
      return {
        connect: { id: customer.id },
        name: dto.customerName ?? `${customer.firstName} ${customer.lastName}`,
        phone: dto.customerPhone ?? customer.phone,
        email: dto.customerEmail ?? customer.email,
      };
    }

    if (!dto.customerName) {
      throw new BadRequestException({
        message: 'A customer name is required for a guest order',
        code: 'CUSTOMER_NAME_REQUIRED',
      });
    }
    return {
      name: dto.customerName,
      phone: dto.customerPhone ?? null,
      email: dto.customerEmail ?? null,
    };
  }

  private async buildItems(
    items: NonNullable<CreateOrderDto['items']>,
  ): Promise<BuiltItem[]> {
    const ids = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) {
        throw new BadRequestException({
          message: `Product ${item.productId} does not exist`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }
      const price = Number(product.price);
      return {
        productId: product.id,
        productNameAr: product.nameAr,
        productNameFr: product.nameFr,
        productSku: product.sku,
        productPrice: price,
        quantity: item.quantity,
        total: round2(price * item.quantity),
        unitCost: product.costPrice === null ? null : Number(product.costPrice),
        packId: null,
        packNameAr: null,
        packNameFr: null,
      };
    });
  }

  /** Expands each pack into its product lines, spreading the pack price. */
  private async buildPackItems(
    packs: NonNullable<CreateOrderDto['packs']>,
  ): Promise<BuiltItem[]> {
    if (!packs.length) return [];
    const found = await this.prisma.pack.findMany({
      where: { id: { in: [...new Set(packs.map((p) => p.packId))] } },
      include: { items: { include: { product: true } } },
    });
    const byId = new Map(found.map((p) => [p.id, p]));
    return packs.flatMap((line) => {
      const pack = byId.get(line.packId);
      if (!pack || pack.status === 'ARCHIVED' || !pack.items.length)
        throw new BadRequestException({
          message: `Pack ${line.packId} is unavailable`,
          code: 'PACK_UNAVAILABLE',
        });
      const shares = allocatePackPrice(
        Number(pack.price),
        pack.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Number(i.product.price),
        })),
      );
      return pack.items.map((component, index) => {
        const quantity = component.quantity * line.quantity;
        const total = round2(shares[index] * line.quantity);
        return {
          productId: component.productId,
          productNameAr: component.product.nameAr,
          productNameFr: component.product.nameFr,
          productSku: component.product.sku,
          productPrice: round2(total / quantity),
          quantity,
          total,
          unitCost:
            component.product.costPrice === null
              ? null
              : Number(component.product.costPrice),
          packId: pack.id,
          packNameAr: pack.nameAr,
          packNameFr: pack.nameFr,
        };
      });
    });
  }

  private async creationRetry(creationKey: string, requestHash: string) {
    const previous = await this.prisma.orderInventory.findUnique({
      where: { creationKey },
      include: { order: { include: orderDetailInclude } },
    });
    if (!previous) return null;
    if (previous.requestHash !== requestHash)
      throw new ConflictException({
        message: 'Idempotency key was already used for a different request',
        code: 'IDEMPOTENCY_KEY_REUSED',
      });
    return previous.order;
  }

  private async createWithUniqueNumber(
    data: Omit<Prisma.OrderCreateInput, 'orderNumber'>,
    actorId?: string,
    creationKey?: string,
    requestHash?: string,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await stockTransaction(this.prisma, async (tx) => {
          const order = await tx.order.create({
            data: {
              ...data,
              orderNumber: generateOrderNumber(),
              inventory: {
                create: { state: 'UNCOMMITTED', creationKey, requestHash },
              },
            },
            include: orderDetailInclude,
          });
          if (order.status === 'CONFIRMED')
            await this.inventory.moveOrder(
              tx,
              order.id,
              'DEDUCTION',
              order.items,
              actorId,
            );
          await tx.auditLog.create({
            data: {
              userId: actorId,
              action: 'order.created',
              entity: 'Order',
              entityId: order.id,
              metadata: {
                orderNumber: order.orderNumber,
                status: order.status,
              },
            },
          });
          return tx.order.findUniqueOrThrow({
            where: { id: order.id },
            include: orderDetailInclude,
          });
        });
      } catch (error) {
        if (
          creationKey &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const previous = await this.creationRetry(creationKey, requestHash!);
          if (previous) return previous;
        }
        const isDuplicate =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          JSON.stringify(error.meta?.target).includes('orderNumber');
        if (!isDuplicate || attempt === 4) {
          throw error;
        }
      }
    }
    // Unreachable, but satisfies the type checker.
    throw new Error('Failed to generate a unique order number');
  }
}

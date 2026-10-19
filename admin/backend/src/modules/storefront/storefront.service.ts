import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CategoriesRepository } from '../categories/categories.repository';
import { ProductsRepository } from '../products/products.repository';
import { SettingsService } from '../settings/settings.service';
import { DeliverySettings, deliveryFeeFor } from '../settings/delivery-fee';
import { OrdersService } from '../orders/orders.service';
import { PacksService } from '../packs/packs.service';
import type { PackResponse } from '../packs/pack.mapper';
import { StorefrontCheckoutDto } from './dto/storefront-checkout.dto';
import {
  StorefrontProductQueryDto,
  StorefrontSort,
} from './dto/storefront-product-query.dto';
import {
  PublicCategory,
  PublicProductCard,
  PublicProductDetail,
  toPublicCategory,
  toPublicProductCard,
  toPublicProductDetail,
} from './storefront.mapper';

export type PublicPack = Omit<
  PackResponse,
  'cost' | 'items' | 'createdAt' | 'updatedAt' | 'status'
> & {
  items: Omit<PackResponse['items'][number], 'unitCost' | 'sku' | 'status'>[];
};

function toPublicPack(pack: PackResponse): PublicPack {
  return {
    id: pack.id,
    nameAr: pack.nameAr,
    nameFr: pack.nameFr,
    slug: pack.slug,
    descriptionAr: pack.descriptionAr,
    descriptionFr: pack.descriptionFr,
    price: pack.price,
    regularPrice: pack.regularPrice,
    discountPercentage: pack.discountPercentage,
    image: pack.image,
    isFeatured: pack.isFeatured,
    items: pack.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      nameAr: i.nameAr,
      nameFr: i.nameFr,
      slug: i.slug,
      unitPrice: i.unitPrice,
      image: i.image,
    })),
  };
}

/** A category id that can never match, used to force an empty result set. */
const NO_MATCH = '__no_match__';

/** Public confirmation returned after a successful checkout (no internals). */
export interface StorefrontOrderConfirmation {
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
  itemCount: number;
}

@Injectable()
export class StorefrontService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly categories: CategoriesRepository,
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly settings: SettingsService,
    private readonly packs: PacksService,
  ) {}

  /** Active offer packs; purchase costs are stripped. */
  async getPacks(): Promise<PublicPack[]> {
    return (await this.packs.findPublic()).map(toPublicPack);
  }

  async getPackBySlug(slug: string): Promise<PublicPack> {
    const [pack] = await this.packs.findPublic(slug);
    if (!pack)
      throw new NotFoundException({
        message: 'Pack not found',
        code: 'PACK_NOT_FOUND',
      });
    return toPublicPack(pack);
  }

  /** Public delivery pricing (flat fee + free-shipping threshold). */
  getDelivery(): Promise<DeliverySettings> {
    return this.settings.getDelivery();
  }

  /** Active categories, ordered, for navigation and shop filters. */
  async getCategories(): Promise<PublicCategory[]> {
    const categories = await this.categories.findAllOrdered();
    return categories.filter((c) => c.isActive).map(toPublicCategory);
  }

  /** Paginated list of ACTIVE products with public-safe fields only. */
  async getProducts(
    query: StorefrontProductQueryDto,
  ): Promise<PaginatedResult<PublicProductCard>> {
    const where: Prisma.ProductWhereInput = { status: ProductStatus.ACTIVE };

    if (query.featured === 'true') {
      where.isFeatured = true;
    }

    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search } },
        { nameFr: { contains: query.search } },
      ];
    }

    if (query.category) {
      const category = await this.categories.findBySlug(query.category);
      where.categoryId = category ? category.id : NO_MATCH;
    }

    const page = query.page;
    const limit = query.limit;
    const [items, total] = await this.products.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: this.orderBy(query.sort),
    });

    return buildPaginatedResult(
      items.map(toPublicProductCard),
      total,
      page,
      limit,
    );
  }

  /** A single ACTIVE product by its public slug. */
  async getProductBySlug(slug: string): Promise<PublicProductDetail> {
    const found = await this.products.findBySlug(slug);
    const product = found ? await this.products.findById(found.id) : null;
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      });
    }
    return toPublicProductDetail(product);
  }

  /**
   * Place a public (cash-on-delivery) order. Resolves cart slugs to ACTIVE
   * products, then delegates to OrdersService so order creation logic — price
   * snapshots, totals, unique order number — is never duplicated. Prices are
   * recomputed server-side; nothing about money is trusted from the client.
   */
  async createOrder(
    dto: StorefrontCheckoutDto,
    ipAddress?: string,
  ): Promise<StorefrontOrderConfirmation> {
    if (!dto.items.length && !dto.packs.length)
      throw new BadRequestException({
        message: 'Your cart is empty',
        code: 'ORDER_ITEMS_REQUIRED',
      });
    const packSlugs = [...new Set(dto.packs.map((p) => p.slug))];
    const packs = packSlugs.length
      ? await this.prisma.pack.findMany({
          where: {
            slug: { in: packSlugs },
            status: ProductStatus.ACTIVE,
            items: { every: { product: { status: ProductStatus.ACTIVE } } },
          },
          select: { id: true, slug: true, price: true },
        })
      : [];
    const packBySlug = new Map(packs.map((p) => [p.slug, p]));
    const packLines = dto.packs.map((line) => {
      const pack = packBySlug.get(line.slug);
      if (!pack)
        throw new BadRequestException({
          message: `Pack "${line.slug}" is unavailable`,
          code: 'PACK_UNAVAILABLE',
        });
      return {
        packId: pack.id,
        quantity: line.quantity,
        price: Number(pack.price),
      };
    });
    const slugs = [...new Set(dto.items.map((i) => i.slug))];
    const products = await this.prisma.product.findMany({
      where: { slug: { in: slugs }, status: ProductStatus.ACTIVE },
      select: { id: true, slug: true, price: true },
    });
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    const items = dto.items.map((item) => {
      const product = bySlug.get(item.slug);
      if (!product) {
        throw new BadRequestException({
          message: `Product "${item.slug}" is unavailable`,
          code: 'PRODUCT_UNAVAILABLE',
        });
      }
      return {
        productId: product.id,
        quantity: item.quantity,
        price: Number(product.price),
      };
    });

    // Delivery is priced server-side from admin settings; the client never
    // sends money. This subtotal mirrors what OrdersService recomputes, so
    // the free-shipping decision uses authoritative DB prices.
    const subtotal =
      Math.round(
        [...items, ...packLines].reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        ) * 100,
      ) / 100;
    const shippingAmount = deliveryFeeFor(
      subtotal,
      await this.settings.getDelivery(),
    );

    const order = await this.orders.create({
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      paymentMethod: 'cash_on_delivery',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingAmount,
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      packs: packLines.map(({ packId, quantity }) => ({ packId, quantity })),
    });

    await this.audit.record({
      action: 'storefront.order_created',
      entity: 'Order',
      entityId: order.id,
      ipAddress,
      metadata: { orderNumber: order.orderNumber, total: order.totalAmount },
    });

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      shippingAmount: order.shippingAmount,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private orderBy(
    sort: StorefrontSort,
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'newest':
        return { createdAt: 'desc' };
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'popular':
      default:
        return { isFeatured: 'desc' };
    }
  }
}

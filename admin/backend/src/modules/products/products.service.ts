import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { slugify } from '../../common/utils/slugify';
import { CategoriesRepository } from '../categories/categories.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { stockTransaction } from '../inventory/stock-transactions';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SetFeaturedDto } from './dto/set-featured.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponse, toProductResponse } from './product.mapper';
import {
  ProductsRepository,
  ProductWithRelations,
} from './products.repository';

const SORTABLE = new Set([
  'createdAt',
  'updatedAt',
  'price',
  'nameFr',
  'nameAr',
]);

@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async create(
    dto: CreateProductDto,
    actorId: string,
  ): Promise<ProductResponse> {
    await this.validateReferences(dto);
    const slug = await this.uniqueSlug(dto.slug ?? dto.nameFr);
    return stockTransaction(this.prisma, async (tx) => {
      const product = await this.repository.create(
        {
          nameAr: dto.nameAr,
          nameFr: dto.nameFr,
          slug,
          shortDescriptionAr: dto.shortDescriptionAr,
          shortDescriptionFr: dto.shortDescriptionFr,
          descriptionAr: dto.descriptionAr,
          descriptionFr: dto.descriptionFr,
          sku: dto.sku,
          price: new Prisma.Decimal(dto.price),
          oldPrice:
            dto.oldPrice != null ? new Prisma.Decimal(dto.oldPrice) : null,
          costPrice:
            dto.costPrice != null ? new Prisma.Decimal(dto.costPrice) : null,
          status: dto.status,
          isFeatured: dto.isFeatured ?? false,
          category: dto.categoryId
            ? { connect: { id: dto.categoryId } }
            : undefined,
        },
        tx,
      );
      if ((dto.initialQuantity ?? 0) > 0) {
        await this.inventory.adjustInTransaction(
          tx,
          product.id,
          {
            delta: dto.initialQuantity!,
            lowStockThreshold: dto.lowStockThreshold,
            reason: dto.stockReason!,
          },
          actorId,
        );
      } else if ((dto.lowStockThreshold ?? 0) > 0) {
        await this.inventory.thresholdInTransaction(
          tx,
          product.id,
          {
            lowStockThreshold: dto.lowStockThreshold!,
            reason: dto.stockReason!,
          },
          actorId,
        );
      }
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'product.created',
          entity: 'Product',
          entityId: product.id,
        },
      });
      return toProductResponse(product);
    });
  }

  async findAll(
    query: ProductQueryDto,
  ): Promise<PaginatedResult<ProductResponse>> {
    const where: Prisma.ProductWhereInput = {};
    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search } },
        { nameFr: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured === 'true';
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const sortBy = SORTABLE.has(query.sortBy ?? '')
      ? (query.sortBy as string)
      : 'createdAt';

    const [items, total] = await this.repository.findMany({
      skip: query.skip,
      take: query.limit,
      where,
      orderBy: { [sortBy]: query.sortOrder },
    });
    return buildPaginatedResult(
      items.map(toProductResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<ProductResponse> {
    return toProductResponse(await this.ensureExists(id));
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const current = await this.ensureExists(id);
    await this.validateReferences(dto, id);

    const data: Prisma.ProductUpdateInput = {
      nameAr: dto.nameAr,
      nameFr: dto.nameFr,
      shortDescriptionAr: dto.shortDescriptionAr,
      shortDescriptionFr: dto.shortDescriptionFr,
      descriptionAr: dto.descriptionAr,
      descriptionFr: dto.descriptionFr,
      sku: dto.sku,
      status: dto.status,
      isFeatured: dto.isFeatured,
    };
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.costPrice !== undefined) {
      data.costPrice =
        dto.costPrice === null ? null : new Prisma.Decimal(dto.costPrice);
    }
    if (dto.oldPrice !== undefined) {
      data.oldPrice =
        dto.oldPrice === null ? null : new Prisma.Decimal(dto.oldPrice);
    }
    if (dto.slug !== undefined) {
      data.slug = await this.uniqueSlug(dto.slug || current.nameFr, id);
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }

    return toProductResponse(await this.repository.update(id, data));
  }

  /**
   * Replaces the homepage selection: the given products become featured in
   * that order, every other product stops being featured.
   */
  async setFeatured(dto: SetFeaturedDto): Promise<{ productIds: string[] }> {
    const ids = dto.productIds;
    const found = await this.prisma.product.count({
      where: { id: { in: ids } },
    });
    if (found !== ids.length) {
      throw new NotFoundException({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      });
    }
    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { id: { notIn: ids }, isFeatured: true },
        data: { isFeatured: false, featuredOrder: 0 },
      }),
      ...ids.map((id, index) =>
        this.prisma.product.update({
          where: { id },
          data: { isFeatured: true, featuredOrder: index },
        }),
      ),
    ]);
    return { productIds: ids };
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.ensureExists(id);
    await this.repository.delete(id);
    return { id };
  }

  async ensureExists(id: string): Promise<ProductWithRelations> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      });
    }
    return product;
  }

  private async validateReferences(
    dto: CreateProductDto | UpdateProductDto,
    excludeId?: string,
  ): Promise<void> {
    if (dto.categoryId) {
      const category = await this.categoriesRepository.findById(dto.categoryId);
      if (!category) {
        throw new BadRequestException({
          message: 'Selected category does not exist',
          code: 'CATEGORY_NOT_FOUND',
        });
      }
    }
    if (dto.sku) {
      const existing = await this.repository.findBySku(dto.sku);
      if (existing && existing.id !== excludeId) {
        throw new BadRequestException({
          message: 'A product with this SKU already exists',
          code: 'SKU_TAKEN',
        });
      }
    }
  }

  private async uniqueSlug(
    source: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(source) || 'product';
    let candidate = base;
    let suffix = 2;
    for (;;) {
      const existing = await this.repository.findBySlug(candidate);
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }
}

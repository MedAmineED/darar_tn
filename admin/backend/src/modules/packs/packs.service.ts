import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { slugify } from '../../common/utils/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage.types';
import {
  CreatePackDto,
  PackItemDto,
  PackQueryDto,
  UpdatePackDto,
} from './dto/pack.dto';
import { PackResponse, packInclude, toPackResponse } from './pack.mapper';

const SORTABLE = new Set(['createdAt', 'updatedAt', 'price', 'nameFr']);

export interface UploadedPackImage {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class PacksService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async findAll(query: PackQueryDto): Promise<PaginatedResult<PackResponse>> {
    const where: Prisma.PackWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search } },
        { nameFr: { contains: query.search } },
      ];
    }
    const sortBy =
      query.sortBy && SORTABLE.has(query.sortBy) ? query.sortBy : 'createdAt';
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pack.findMany({
        where,
        include: packInclude,
        skip: query.skip,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder },
      }),
      this.prisma.pack.count({ where }),
    ]);
    return buildPaginatedResult(
      items.map(toPackResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<PackResponse> {
    const pack = await this.prisma.pack.findUnique({
      where: { id },
      include: packInclude,
    });
    if (!pack) throw this.notFound();
    return toPackResponse(pack);
  }

  /** ACTIVE packs whose every component is ACTIVE — safe for the storefront. */
  async findPublic(slug?: string): Promise<PackResponse[]> {
    const packs = await this.prisma.pack.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        ...(slug ? { slug } : {}),
        items: { every: { product: { status: ProductStatus.ACTIVE } } },
      },
      include: packInclude,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
    return packs.filter((p) => p.items.length > 0).map(toPackResponse);
  }

  async create(dto: CreatePackDto): Promise<PackResponse> {
    const items = await this.validateItems(dto.items);
    const slug = await this.uniqueSlug(dto.slug ?? slugify(dto.nameFr));
    const pack = await this.prisma.pack.create({
      data: {
        nameAr: dto.nameAr,
        nameFr: dto.nameFr,
        slug,
        descriptionAr: dto.descriptionAr,
        descriptionFr: dto.descriptionFr,
        price: new Prisma.Decimal(dto.price),
        status: dto.status,
        isFeatured: dto.isFeatured,
        items: { create: items },
      },
      include: packInclude,
    });
    return toPackResponse(pack);
  }

  async update(id: string, dto: UpdatePackDto): Promise<PackResponse> {
    const existing = await this.prisma.pack.findUnique({ where: { id } });
    if (!existing) throw this.notFound();
    const items = dto.items ? await this.validateItems(dto.items) : undefined;
    const slug =
      dto.slug && dto.slug !== existing.slug
        ? await this.uniqueSlug(dto.slug, id)
        : undefined;
    const pack = await this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.packItem.deleteMany({ where: { packId: id } });
        await tx.packItem.createMany({
          data: items.map((i) => ({ ...i, packId: id })),
        });
      }
      return tx.pack.update({
        where: { id },
        data: {
          nameAr: dto.nameAr,
          nameFr: dto.nameFr,
          slug,
          descriptionAr: dto.descriptionAr,
          descriptionFr: dto.descriptionFr,
          price:
            dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
          status: dto.status,
          isFeatured: dto.isFeatured,
        },
        include: packInclude,
      });
    });
    return toPackResponse(pack);
  }

  /** Packs already sold are archived instead of deleted (order history). */
  async remove(id: string): Promise<{ archived: boolean }> {
    const pack = await this.prisma.pack.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!pack) throw this.notFound();
    if (pack._count.orderItems > 0) {
      await this.prisma.pack.update({
        where: { id },
        data: { status: ProductStatus.ARCHIVED },
      });
      return { archived: true };
    }
    await this.prisma.pack.delete({ where: { id } });
    if (pack.image) await this.deleteStored(pack.image);
    return { archived: false };
  }

  async setImage(id: string, file: UploadedPackImage): Promise<PackResponse> {
    const existing = await this.prisma.pack.findUnique({ where: { id } });
    if (!existing) throw this.notFound();
    const stored = await this.storage.save(file.buffer, {
      folder: 'packs',
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    const pack = await this.prisma.pack.update({
      where: { id },
      data: { image: stored.url },
      include: packInclude,
    });
    if (existing.image) await this.deleteStored(existing.image);
    return toPackResponse(pack);
  }

  private async deleteStored(url: string): Promise<void> {
    const key = url.replace(/^\/uploads\//, '');
    try {
      await this.storage.delete(key);
    } catch {
      /* A missing file must not block the database change. */
    }
  }

  private async validateItems(
    items: PackItemDto[],
  ): Promise<{ productId: string; quantity: number }[]> {
    const merged = new Map<string, number>();
    for (const item of items)
      merged.set(
        item.productId,
        (merged.get(item.productId) ?? 0) + item.quantity,
      );
    const found = await this.prisma.product.count({
      where: { id: { in: [...merged.keys()] } },
    });
    if (found !== merged.size)
      throw new BadRequestException({
        message: 'One or more pack products do not exist',
        code: 'PRODUCT_NOT_FOUND',
      });
    return [...merged].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async uniqueSlug(base: string, ignoreId?: string): Promise<string> {
    const root = base || `pack-${randomBytes(3).toString('hex')}`;
    for (let i = 0; i < 20; i += 1) {
      const candidate = i === 0 ? root : `${root}-${i + 1}`;
      const clash = await this.prisma.pack.findUnique({
        where: { slug: candidate },
      });
      if (!clash || clash.id === ignoreId) return candidate;
    }
    throw new ConflictException({
      message: 'Could not generate a unique slug',
      code: 'SLUG_CONFLICT',
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      message: 'Pack not found',
      code: 'PACK_NOT_FOUND',
    });
  }
}

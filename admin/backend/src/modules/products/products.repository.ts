import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const productInclude = {
  category: { select: { id: true, nameAr: true, nameFr: true, slug: true } },
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<{ id: string } | null> {
    return this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  findBySku(sku: string): Promise<{ id: string } | null> {
    return this.prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });
  }

  findById(id: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
  }

  findMany(params: {
    skip: number;
    take: number;
    where: Prisma.ProductWhereInput;
    orderBy:
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[];
  }): Promise<[ProductWithRelations[], number]> {
    return this.prisma.$transaction([
      this.prisma.product.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: productInclude,
      }),
      this.prisma.product.count({ where: params.where }),
    ]);
  }

  create(
    data: Prisma.ProductCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<ProductWithRelations> {
    return tx.product.create({
      data: { ...data, inventory: { create: {} } },
      include: productInclude,
    });
  }

  update(
    id: string,
    data: Prisma.ProductUpdateInput,
  ): Promise<ProductWithRelations> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Inventory row deletion is restricted when movement history exists.
      await tx.inventoryItem.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
  }
}

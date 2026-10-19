import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const categoryInclude = {
  parent: { select: { id: true, nameAr: true, nameFr: true } },
  _count: { select: { children: true, products: true } },
} satisfies Prisma.CategoryInclude;

export type CategoryWithMeta = Prisma.CategoryGetPayload<{
  include: typeof categoryInclude;
}>;

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<{ id: string } | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  findById(id: string): Promise<CategoryWithMeta | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: categoryInclude,
    });
  }

  findMany(params: {
    skip: number;
    take: number;
    where: Prisma.CategoryWhereInput;
    orderBy: Prisma.CategoryOrderByWithRelationInput[];
  }): Promise<[CategoryWithMeta[], number]> {
    return this.prisma.$transaction([
      this.prisma.category.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: categoryInclude,
      }),
      this.prisma.category.count({ where: params.where }),
    ]);
  }

  findAllOrdered(): Promise<CategoryWithMeta[]> {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameFr: 'asc' }],
      include: categoryInclude,
    });
  }

  create(data: Prisma.CategoryCreateInput): Promise<CategoryWithMeta> {
    return this.prisma.category.create({ data, include: categoryInclude });
  }

  update(
    id: string,
    data: Prisma.CategoryUpdateInput,
  ): Promise<CategoryWithMeta> {
    return this.prisma.category.update({
      where: { id },
      data,
      include: categoryInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  /** Collects a category and all of its descendant IDs (cycle-safe). */
  async collectSubtreeIds(rootId: string): Promise<Set<string>> {
    const ids = new Set<string>([rootId]);
    let frontier = [rootId];
    while (frontier.length > 0) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id).filter((id) => !ids.has(id));
      frontier.forEach((id) => ids.add(id));
    }
    return ids;
  }
}

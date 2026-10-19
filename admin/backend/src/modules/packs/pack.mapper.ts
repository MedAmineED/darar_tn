import { Prisma, ProductStatus } from '@prisma/client';

export const packInclude = {
  items: {
    include: {
      product: {
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
          },
        },
      },
    },
    orderBy: { productId: 'asc' },
  },
} satisfies Prisma.PackInclude;

export type PackWithItems = Prisma.PackGetPayload<{
  include: typeof packInclude;
}>;

export interface PackItemResponse {
  productId: string;
  quantity: number;
  nameAr: string;
  nameFr: string;
  slug: string;
  sku: string | null;
  unitPrice: number;
  unitCost: number | null;
  image: string | null;
  status: ProductStatus;
}

export interface PackResponse {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  descriptionAr: string | null;
  descriptionFr: string | null;
  price: number;
  /** Sum of the component products at their current prices. */
  regularPrice: number;
  /** Computed, never stored. */
  discountPercentage: number | null;
  /** Null when any component has no purchase cost yet. */
  cost: number | null;
  image: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  items: PackItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function toPackResponse(pack: PackWithItems): PackResponse {
  const items: PackItemResponse[] = pack.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    nameAr: item.product.nameAr,
    nameFr: item.product.nameFr,
    slug: item.product.slug,
    sku: item.product.sku,
    unitPrice: Number(item.product.price),
    unitCost:
      item.product.costPrice === null ? null : Number(item.product.costPrice),
    image: item.product.images[0]?.url ?? null,
    status: item.product.status,
  }));
  const price = Number(pack.price);
  const regularPrice = round2(
    items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  );
  const cost = items.some((i) => i.unitCost === null)
    ? null
    : round2(items.reduce((sum, i) => sum + (i.unitCost ?? 0) * i.quantity, 0));
  return {
    id: pack.id,
    nameAr: pack.nameAr,
    nameFr: pack.nameFr,
    slug: pack.slug,
    descriptionAr: pack.descriptionAr,
    descriptionFr: pack.descriptionFr,
    price,
    regularPrice,
    discountPercentage:
      regularPrice > price
        ? Math.round(((regularPrice - price) / regularPrice) * 100)
        : null,
    cost,
    image: pack.image ?? items[0]?.image ?? null,
    status: pack.status,
    isFeatured: pack.isFeatured,
    items,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
  };
}

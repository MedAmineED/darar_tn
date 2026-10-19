import { Prisma, ProductStatus } from '@prisma/client';
import type { ProductWithRelations } from './products.repository';

export interface ProductImageResponse {
  id: string;
  url: string;
  altAr: string | null;
  altFr: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductResponse {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  shortDescriptionAr: string | null;
  shortDescriptionFr: string | null;
  descriptionAr: string | null;
  descriptionFr: string | null;
  sku: string | null;
  price: number;
  oldPrice: number | null;
  costPrice: number | null;
  discountPercentage: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  categoryId: string | null;
  category: {
    id: string;
    nameAr: string;
    nameFr: string;
    slug: string;
  } | null;
  images: ProductImageResponse[];
  createdAt: Date;
  updatedAt: Date;
}

function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function discountPercentage(
  price: number,
  oldPrice: number | null,
): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function toProductResponse(
  product: ProductWithRelations,
): ProductResponse {
  const price = Number(product.price);
  const oldPrice = toNumber(product.oldPrice);
  return {
    id: product.id,
    nameAr: product.nameAr,
    nameFr: product.nameFr,
    slug: product.slug,
    shortDescriptionAr: product.shortDescriptionAr,
    shortDescriptionFr: product.shortDescriptionFr,
    descriptionAr: product.descriptionAr,
    descriptionFr: product.descriptionFr,
    sku: product.sku,
    price,
    oldPrice,
    costPrice: toNumber(product.costPrice),
    discountPercentage: discountPercentage(price, oldPrice),
    status: product.status,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    category: product.category,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altAr: image.altAr,
      altFr: image.altFr,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

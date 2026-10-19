import type { CategoryWithMeta } from '../categories/categories.repository';
import type { ProductWithRelations } from '../products/products.repository';

/**
 * Public storefront shapes. These deliberately expose ONLY customer-facing
 * fields — never internal status, SKU, cost, timestamps, or internal ids.
 * The product `slug` is the public identifier used in URLs.
 */

export interface PublicProductImage {
  url: string;
  altAr: string | null;
  altFr: string | null;
}

export interface PublicCategory {
  nameAr: string;
  nameFr: string;
  slug: string;
  image: string | null;
  productCount: number;
}

export interface PublicProductCard {
  nameAr: string;
  nameFr: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  discountPercentage: number | null;
  isFeatured: boolean;
  primaryImage: PublicProductImage | null;
  category: Pick<PublicCategory, 'nameAr' | 'nameFr' | 'slug'> | null;
}

export interface PublicProductDetail extends PublicProductCard {
  shortDescriptionAr: string | null;
  shortDescriptionFr: string | null;
  descriptionAr: string | null;
  descriptionFr: string | null;
  images: PublicProductImage[];
}

function discountPercentage(
  price: number,
  oldPrice: number | null,
): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function toPublicImage(image: {
  url: string;
  altAr: string | null;
  altFr: string | null;
}): PublicProductImage {
  return { url: image.url, altAr: image.altAr, altFr: image.altFr };
}

export function toPublicCategory(category: CategoryWithMeta): PublicCategory {
  return {
    nameAr: category.nameAr,
    nameFr: category.nameFr,
    slug: category.slug,
    image: category.image,
    productCount: category._count.products,
  };
}

export function toPublicProductCard(
  product: ProductWithRelations,
): PublicProductCard {
  const price = Number(product.price);
  const oldPrice = product.oldPrice === null ? null : Number(product.oldPrice);
  const primary = product.images[0] ?? null;
  return {
    nameAr: product.nameAr,
    nameFr: product.nameFr,
    slug: product.slug,
    price,
    oldPrice,
    discountPercentage: discountPercentage(price, oldPrice),
    isFeatured: product.isFeatured,
    primaryImage: primary ? toPublicImage(primary) : null,
    category: product.category
      ? {
          nameAr: product.category.nameAr,
          nameFr: product.category.nameFr,
          slug: product.category.slug,
        }
      : null,
  };
}

export function toPublicProductDetail(
  product: ProductWithRelations,
): PublicProductDetail {
  return {
    ...toPublicProductCard(product),
    shortDescriptionAr: product.shortDescriptionAr,
    shortDescriptionFr: product.shortDescriptionFr,
    descriptionAr: product.descriptionAr,
    descriptionFr: product.descriptionFr,
    images: product.images.map(toPublicImage),
  };
}

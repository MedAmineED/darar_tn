/** Types mirroring the NestJS storefront API (public, read-only). */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error?: { code?: string };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface StorefrontImage {
  url: string;
  altAr: string | null;
  altFr: string | null;
}

export interface StorefrontCategory {
  nameAr: string;
  nameFr: string;
  slug: string;
  image: string | null;
  productCount: number;
}

export interface StorefrontProduct {
  nameAr: string;
  nameFr: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  discountPercentage: number | null;
  isFeatured: boolean;
  primaryImage: StorefrontImage | null;
  category: Pick<StorefrontCategory, 'nameAr' | 'nameFr' | 'slug'> | null;
}

export interface StorefrontProductDetail extends StorefrontProduct {
  shortDescriptionAr: string | null;
  shortDescriptionFr: string | null;
  descriptionAr: string | null;
  descriptionFr: string | null;
  images: StorefrontImage[];
}

export const PRODUCT_SORTS = [
  'popular',
  'newest',
  'price_asc',
  'price_desc',
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export function isProductSort(value: string | undefined): value is ProductSort {
  return (
    value === 'popular' ||
    value === 'newest' ||
    value === 'price_asc' ||
    value === 'price_desc'
  );
}

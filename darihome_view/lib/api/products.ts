import 'server-only';
import { resolveMediaUrl } from '../media';
import { apiGet, ApiError } from './client';
import type {
  Paginated,
  ProductSort,
  StorefrontImage,
  StorefrontProduct,
  StorefrontProductDetail,
} from './types';

function withImage(image: StorefrontImage | null): StorefrontImage | null {
  if (!image) return null;
  return { ...image, url: resolveMediaUrl(image.url) ?? image.url };
}

function mapCard(product: StorefrontProduct): StorefrontProduct {
  return { ...product, primaryImage: withImage(product.primaryImage) };
}

function mapDetail(
  product: StorefrontProductDetail,
): StorefrontProductDetail {
  return {
    ...product,
    primaryImage: withImage(product.primaryImage),
    images: product.images.map((img) => withImage(img) ?? img),
  };
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: ProductSort;
  featured?: boolean;
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<Paginated<StorefrontProduct>> {
  const data = await apiGet<Paginated<StorefrontProduct>>(
    '/storefront/products',
    {
      searchParams: {
        page: params.page,
        limit: params.limit,
        search: params.search,
        category: params.category,
        sort: params.sort,
        featured: params.featured ? 'true' : undefined,
      },
    },
  );
  return { items: data.items.map(mapCard), meta: data.meta };
}

export async function getFeaturedProducts(
  limit = 4,
): Promise<StorefrontProduct[]> {
  const data = await getProducts({ featured: true, limit, sort: 'popular' });
  return data.items;
}

/** Returns null on a 404 so callers can render a proper not-found page. */
export async function getProduct(
  slug: string,
): Promise<StorefrontProductDetail | null> {
  try {
    const data = await apiGet<StorefrontProductDetail>(
      `/storefront/products/${encodeURIComponent(slug)}`,
    );
    return mapDetail(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getRelatedProducts(
  categorySlug: string | undefined,
  excludeSlug: string,
  limit = 4,
): Promise<StorefrontProduct[]> {
  if (!categorySlug) return [];
  const data = await getProducts({ category: categorySlug, limit: limit + 1 });
  return data.items.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

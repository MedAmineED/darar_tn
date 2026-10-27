import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/api/products';
import { getPacks } from '@/lib/api/packs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/packs`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  // Product entries. Paginates through the catalogue so large stores stay
  // fully covered rather than silently truncated at one page.
  const products: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    for (;;) {
      const result = await getProducts({ page, limit: 48, sort: 'newest' });
      for (const product of result.items) {
        products.push({
          url: `${siteUrl}/products/${product.slug}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      if (!result.meta.hasNextPage || page >= 50) break;
      page += 1;
    }
  } catch {
    // If the API is unavailable at build time, ship the static routes only.
  }

  const packs: MetadataRoute.Sitemap = await getPacks()
    .then((list) =>
      list.map((pack) => ({
        url: `${siteUrl}/packs/${pack.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    )
    .catch(() => []);

  return [...staticRoutes, ...products, ...packs];
}

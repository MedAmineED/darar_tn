import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/lib/i18n/server';
import { getCategories } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import type { StorefrontCategory } from '@/lib/api/types';
import { parseShopParams } from '@/lib/shop';
import { productCountLabel } from '@/lib/i18n/config';
import { Icon } from '@/components/ui/Icon';
import { ProductCard } from '@/components/product/ProductCard';
import { FilterContent } from '@/components/shop/FilterContent';
import { FiltersDrawer } from '@/components/shop/FiltersDrawer';
import { Pagination } from '@/components/shop/Pagination';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.meta.shopTitle,
    description: dict.shop.subtitle,
    alternates: { canonical: '/shop' },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, dict } = await getI18n();
  const params = parseShopParams(await searchParams);

  const [page, categories] = await Promise.all([
    getProducts({
      category: params.category,
      search: params.search,
      sort: params.sort,
      page: params.page,
      limit: 12,
    }),
    getCategories().catch((): StorefrontCategory[] => []),
  ]);

  const filters = (
    <FilterContent
      categories={categories}
      params={params}
      locale={locale}
      dict={dict}
    />
  );

  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-24 lg:pt-28 pb-20">
      <div className="reveal">
        <nav
          className="flex items-center gap-2 text-sm text-on-surface-variant mb-6"
          aria-label="breadcrumb"
        >
          <Link href="/" className="hover:text-primary">
            {dict.product.home}
          </Link>
          <Icon name="chevron_left" className="flip-rtl !text-[16px]" />
          <span className="text-on-surface font-medium">{dict.nav.shop}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b hairline pb-8">
          <div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold">
              {dict.shop.title}
            </h1>
            <p className="text-on-surface-variant mt-2">
              <span>{dict.shop.subtitle}</span>
              <span className="text-outline text-sm ms-1">
                ({productCountLabel(locale, page.meta.total)})
              </span>
            </p>
          </div>
          <FiltersDrawer dict={dict}>{filters}</FiltersDrawer>
        </div>
      </div>

      <div className="flex gap-10 lg:gap-14 pt-10">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">{filters}</div>
        </aside>

        <div className="flex-1">
          {page.items.length === 0 ? (
            <div className="py-24 text-center text-on-surface-variant">
              {dict.shop.empty}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {page.items.map((product, i) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  locale={locale}
                  dict={dict}
                  index={i}
                  sizes="(min-width: 1024px) 28vw, 50vw"
                />
              ))}
            </div>
          )}

          <Pagination meta={page.meta} params={params} dict={dict} />
        </div>
      </div>
    </main>
  );
}

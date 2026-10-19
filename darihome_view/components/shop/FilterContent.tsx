import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { ProductSort, StorefrontCategory } from '@/lib/api/types';
import { buildShopHref, type ShopParams } from '@/lib/shop';
import { clsx } from '@/lib/clsx';
import { ShopSearch } from './ShopSearch';

/**
 * The filter controls (sort + categories), rendered server-side as plain links
 * so filtering works without client JavaScript and stays crawlable. Shared by
 * the desktop sidebar and the mobile drawer.
 */
export function FilterContent({
  categories,
  params,
  locale,
  dict,
}: {
  categories: StorefrontCategory[];
  params: ShopParams;
  locale: Locale;
  dict: Dictionary;
}) {
  const sorts: { key: ProductSort; label: string }[] = [
    { key: 'popular', label: dict.shop.sortPopular },
    { key: 'newest', label: dict.shop.sortNewest },
    { key: 'price_asc', label: dict.shop.sortPriceAsc },
    { key: 'price_desc', label: dict.shop.sortPriceDesc },
  ];
  // Show all categories the admin created, even those without products yet.
  const visibleCategories = categories;

  return (
    <div className="flex flex-col gap-9">
      <ShopSearch params={params} dict={dict} />
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
          {dict.shop.sortBy}
        </h3>
        <ul className="flex flex-col gap-3 text-sm">
          {sorts.map((s) => (
            <li key={s.key}>
              <Link
                href={buildShopHref(params, { sort: s.key, page: 1 })}
                aria-current={params.sort === s.key ? 'true' : undefined}
                className={clsx(
                  'inline-flex items-center gap-3 hover:text-primary',
                  params.sort === s.key && 'font-semibold text-primary',
                )}
              >
                <span
                  className={clsx(
                    'h-3.5 w-3.5 rounded-full border',
                    params.sort === s.key
                      ? 'border-primary bg-primary'
                      : 'border-outline',
                  )}
                />
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t hairline pt-7">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
          {dict.shop.categories}
        </h3>
        <ul className="flex flex-col gap-3 text-sm">
          <li className="flex items-center justify-between">
            <Link
              href={buildShopHref(params, { category: undefined, page: 1 })}
              className={clsx(
                'hover:text-primary',
                !params.category && 'font-medium border-b-2 border-primary pb-0.5',
              )}
            >
              {dict.shop.all}
            </Link>
          </li>
          {visibleCategories.map((category) => {
            const active = params.category === category.slug;
            return (
              <li
                key={category.slug}
                className="flex items-center justify-between"
              >
                <Link
                  href={buildShopHref(params, {
                    category: category.slug,
                    page: 1,
                  })}
                  className={clsx(
                    'hover:text-primary',
                    active && 'font-medium border-b-2 border-primary pb-0.5',
                  )}
                >
                  {localize(locale, category.nameAr, category.nameFr)}
                </Link>
                <span className="text-outline">{category.productCount}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

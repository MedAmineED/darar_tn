'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { formatPrice } from '@/lib/format';
import {
  pushRecentlyViewed,
  readRecentlyViewed,
  type ViewedProduct,
} from '@/lib/recently-viewed';

/**
 * "Recently viewed" rail.
 *
 * Records the product being looked at and lists the ones before it. This is
 * the cheapest way to keep a session alive: it turns a dead end — a product
 * the shopper decided against — into a route back into the catalogue instead
 * of a reason to close the tab. Props are primitives so the effect's
 * dependencies stay stable across re-renders.
 */
export function RecentlyViewed({
  locale,
  dict,
  slug,
  nameAr,
  nameFr,
  price,
  image,
}: {
  locale: Locale;
  dict: Dictionary;
  slug: string;
  nameAr: string;
  nameFr: string;
  price: number;
  image: string | null;
}) {
  // `null` until the browser store has been read, so the server render and the
  // first client render agree (localStorage does not exist on the server).
  const [items, setItems] = useState<ViewedProduct[] | null>(null);

  useEffect(() => {
    // Read the history *before* recording this product, so the page you are on
    // never shows up in its own rail.
    setItems(readRecentlyViewed().filter((entry) => entry.slug !== slug));
    pushRecentlyViewed({ slug, nameAr, nameFr, price, image });
  }, [slug, nameAr, nameFr, price, image]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-20">
      <h2 className="font-display text-2xl font-semibold md:text-3xl">
        {dict.product.recentlyViewed}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((entry) => {
          const name = localize(locale, entry.nameAr, entry.nameFr);
          return (
            <Link
              key={entry.slug}
              href={`/products/${entry.slug}`}
              className="group block"
            >
              <div className="card-media relative aspect-square overflow-hidden rounded bg-surface-low">
                {entry.image ? (
                  <Image
                    src={entry.image}
                    alt={name}
                    fill
                    sizes="(min-width: 1024px) 16vw, 45vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs text-outline">
                    {dict.brand.name}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                {name}
              </p>
              <p className="text-sm text-on-surface-variant">
                {formatPrice(entry.price, dict.common.currency)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

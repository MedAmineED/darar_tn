import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { StorefrontCategory } from '@/lib/api/types';
import { Icon } from '@/components/ui/Icon';

// Fallback imagery for categories that have no image yet (keeps the design intact).
const FALLBACKS = [
  '/assets/images/stool-rug.jpg',
  '/assets/images/desk.jpg',
  '/assets/images/wall-shelves.jpg',
  '/assets/images/pet-house.jpg',
];

export function CategoryGrid({
  categories,
  locale,
  dict,
}: {
  categories: StorefrontCategory[];
  locale: Locale;
  dict: Dictionary;
}) {
  // Show every active category the admin has created — no cap, no product
  // filter — so newly added categories appear on the storefront immediately.
  const shown = categories;
  if (shown.length === 0) return null;

  return (
    <section id="categories" className="py-20 md:py-28">
      <div className="max-w-container mx-auto px-5 md:px-16">
        <div className="text-center max-w-xl mx-auto mb-14 reveal">
          <h2 className="font-display text-4xl md:text-5xl font-semibold">
            {dict.cats.title}
          </h2>
          <p className="text-on-surface-variant mt-4">{dict.cats.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {shown.map((category, i) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="group product-card reveal relative block rounded-lg overflow-hidden aspect-[3/4]"
              style={{ '--reveal-delay': `${i * 80}ms` } as CSSProperties}
            >
              <div className="card-media absolute inset-0">
                <Image
                  src={category.image ?? FALLBACKS[i % FALLBACKS.length]!}
                  alt={localize(locale, category.nameAr, category.nameFr)}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="tile-scrim absolute inset-0" />
              <div className="absolute bottom-0 inset-x-0 p-5 text-on-primary">
                <h3 className="font-display text-2xl font-semibold">
                  {localize(locale, category.nameAr, category.nameFr)}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest mt-1 opacity-90">
                  <span>{dict.cats.shopNow}</span>
                  <Icon
                    name="arrow_forward"
                    className="flip-rtl !text-[16px] group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

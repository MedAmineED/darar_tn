import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { StorefrontProduct } from '@/lib/api/types';
import { Icon } from '@/components/ui/Icon';
import { ProductCard } from '@/components/product/ProductCard';

export function FeaturedProducts({
  products,
  locale,
  dict,
}: {
  products: StorefrontProduct[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="max-w-container mx-auto px-5 md:px-16">
        <div className="flex items-end justify-between gap-6 mb-12 reveal">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              {dict.featured.title}
            </h2>
            <p className="text-on-surface-variant mt-3">{dict.featured.subtitle}</p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary shrink-0 nav-link"
          >
            <span>{dict.featured.viewAll}</span>
            <Icon name="arrow_forward" className="flip-rtl !text-[18px]" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard
              key={product.slug}
              product={product}
              locale={locale}
              dict={dict}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

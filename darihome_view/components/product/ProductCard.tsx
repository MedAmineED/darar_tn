import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { StorefrontProduct } from '@/lib/api/types';
import { formatPrice } from '@/lib/format';
import { AddToCartButton } from './AddToCartButton';

export function ProductCard({
  product,
  locale,
  dict,
  index = 0,
  sizes = '(min-width: 1024px) 25vw, 50vw',
}: {
  product: StorefrontProduct;
  locale: Locale;
  dict: Dictionary;
  index?: number;
  sizes?: string;
}) {
  const name = localize(locale, product.nameAr, product.nameFr);
  const categoryName = product.category
    ? localize(locale, product.category.nameAr, product.category.nameFr)
    : null;
  const image = product.primaryImage;
  const alt = image
    ? localize(locale, image.altAr, image.altFr) || name
    : name;
  const href = `/products/${product.slug}`;

  return (
    <article
      className="product-card reveal bg-white rounded-lg overflow-hidden"
      style={{ '--reveal-delay': `${(index % 4) * 80}ms` } as CSSProperties}
    >
      <div className="card-media relative block aspect-square bg-surface-low">
        <Link href={href} aria-label={name} className="absolute inset-0 z-[1]">
          {image ? (
            <Image
              src={image.url}
              alt={alt}
              fill
              sizes={sizes}
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-outline">
              {dict.brand.name}
            </span>
          )}
        </Link>
        {product.discountPercentage != null && (
          <>
            <span className="absolute top-3 start-3 z-[2] bg-primary text-on-primary px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide">
              {dict.featured.sale}
            </span>
            <span className="absolute top-3 end-3 z-[2] bg-wood text-primary px-2 py-1 rounded text-[11px] font-bold">
              -{product.discountPercentage}%
            </span>
          </>
        )}
        <div className="quick-add absolute bottom-3 inset-x-3 z-[2]">
          <AddToCartButton
            item={{
              slug: product.slug,
              nameAr: product.nameAr,
              nameFr: product.nameFr,
              price: product.price,
              image: image?.url ?? null,
            }}
            label={dict.featured.add}
            addedLabel={dict.product.added}
            className="w-full py-2.5 text-xs"
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-snug">
          <Link href={href}>{name}</Link>
        </h3>
        {categoryName && (
          <p className="text-sm text-on-surface-variant mt-0.5">{categoryName}</p>
        )}
        <div className="flex items-baseline gap-2 mt-2">
          <span
            className={
              product.oldPrice ? 'font-semibold text-primary' : 'font-semibold'
            }
          >
            {formatPrice(product.price, dict.common.currency)}
          </span>
          {product.oldPrice != null && (
            <span className="text-sm text-outline line-through">
              {formatPrice(product.oldPrice, dict.common.currency)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

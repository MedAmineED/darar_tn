import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { StorefrontPack } from '@/lib/api/packs';
import { formatPrice } from '@/lib/format';
import { packCartSlug } from '@/lib/cart';
import { AddToCartButton } from '@/components/product/AddToCartButton';

export function PackCard({
  pack,
  locale,
  dict,
  index = 0,
}: {
  pack: StorefrontPack;
  locale: Locale;
  dict: Dictionary;
  index?: number;
}) {
  const name = localize(locale, pack.nameAr, pack.nameFr);
  const description = localize(
    locale,
    pack.descriptionAr ?? '',
    pack.descriptionFr ?? '',
  );
  const saving = Math.max(0, pack.regularPrice - pack.price);
  return (
    <article
      className="reveal bg-white rounded-lg overflow-hidden flex flex-col"
      style={{ '--reveal-delay': `${(index % 3) * 80}ms` } as CSSProperties}
    >
      <Link
        href={`/packs/${pack.slug}`}
        className="relative block aspect-[4/3] bg-surface-low"
        aria-label={name}
      >
        {pack.image ? (
          <Image
            src={pack.image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-outline">
            {dict.brand.name}
          </span>
        )}
        <span className="absolute top-3 start-3 bg-primary text-on-primary px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide">
          {dict.packs.badge}
        </span>
        {pack.discountPercentage != null && (
          <span className="absolute top-3 end-3 bg-wood text-primary px-2 py-1 rounded text-[11px] font-bold">
            -{pack.discountPercentage}%
          </span>
        )}
      </Link>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-display text-xl font-semibold leading-snug">
          <Link href={`/packs/${pack.slug}`} className="hover:text-primary">
            {name}
          </Link>
        </h3>
        {description && (
          <p className="text-sm text-on-surface-variant line-clamp-3">
            {description}
          </p>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-outline mb-1.5">
            {dict.packs.includes}
          </p>
          <ul className="text-sm flex flex-col gap-1">
            {pack.items.map((item) => (
              <li key={item.productId} className="flex gap-2">
                <span className="font-semibold text-primary">
                  {item.quantity}×
                </span>
                <Link
                  href={`/products/${item.slug}`}
                  className="hover:text-primary"
                >
                  {localize(locale, item.nameAr, item.nameFr)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl font-semibold text-primary">
            {formatPrice(pack.price, dict.common.currency)}
          </span>
          {saving > 0 && (
            <>
              <span className="text-sm text-outline line-through">
                {formatPrice(pack.regularPrice, dict.common.currency)}
              </span>
              <span className="text-xs font-semibold text-primary">
                {dict.packs.save} {formatPrice(saving, dict.common.currency)}
              </span>
            </>
          )}
        </div>
        <AddToCartButton
          item={{
            slug: packCartSlug(pack.slug),
            nameAr: pack.nameAr,
            nameFr: pack.nameFr,
            price: pack.price,
            image: pack.image,
          }}
          label={dict.featured.add}
          addedLabel={dict.product.added}
          className="w-full py-3 text-sm"
        />
      </div>
    </article>
  );
}

import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n, getLocale } from '@/lib/i18n/server';
import { localize } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getPack, getPacks, type StorefrontPack } from '@/lib/api/packs';
import type { StorefrontImage } from '@/lib/api/types';
import { packCartSlug } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { Accordion } from '@/components/product/Accordion';
import { TrustRow } from '@/components/product/TrustRow';
import { StickyBuyBar } from '@/components/product/StickyBuyBar';
import { PackCard } from '@/components/packs/PackCard';
import { JsonLd } from '@/components/seo/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const pack = await getPack(slug);

  if (!pack) {
    return { title: dict.packs.title, robots: { index: false } };
  }

  const name = localize(locale, pack.nameAr, pack.nameFr);
  const description =
    localize(locale, pack.descriptionAr ?? '', pack.descriptionFr ?? '') ||
    dict.packs.subtitle;
  const url = `/packs/${pack.slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description,
      url,
      type: 'website',
      images: pack.image ? [{ url: pack.image, alt: name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: pack.image ? [pack.image] : undefined,
    },
  };
}

/** Pack cover first, then each included product's photo (no duplicates). */
function packImages(pack: StorefrontPack): StorefrontImage[] {
  const urls = [pack.image, ...pack.items.map((i) => i.image)].filter(
    (url): url is string => Boolean(url),
  );
  return [...new Set(urls)].map((url) => ({ url, altAr: null, altFr: null }));
}

export default async function PackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, dict } = await getI18n();
  const pack = await getPack(slug);
  if (!pack) notFound();

  const name = localize(locale, pack.nameAr, pack.nameFr);
  const description = localize(
    locale,
    pack.descriptionAr ?? '',
    pack.descriptionFr ?? '',
  );
  const saving = Math.max(0, pack.regularPrice - pack.price);

  const cartItem = {
    slug: packCartSlug(pack.slug),
    nameAr: pack.nameAr,
    nameFr: pack.nameFr,
    price: pack.price,
    image: pack.image,
  };

  const others = (await getPacks().catch((): StorefrontPack[] => []))
    .filter((p) => p.slug !== pack.slug)
    .slice(0, 3);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || name,
    image: packImages(pack).map((img) => img.url),
    brand: { '@type': 'Brand', name: 'Darar' },
    offers: {
      '@type': 'Offer',
      price: pack.price,
      priceCurrency: 'TND',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/packs/${pack.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.product.home, item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: dict.packs.title,
        item: `${siteUrl}/packs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: `${siteUrl}/packs/${pack.slug}`,
      },
    ],
  };

  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-24 lg:pt-28 pb-20">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav
        className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant mb-8"
        aria-label="breadcrumb"
      >
        <Link href="/" className="hover:text-primary">
          {dict.product.home}
        </Link>
        <Icon name="chevron_left" className="flip-rtl !text-[16px]" />
        <Link href="/packs" className="hover:text-primary">
          {dict.packs.title}
        </Link>
        <Icon name="chevron_left" className="flip-rtl !text-[16px]" />
        <span className="text-on-surface font-medium">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
        <ProductGallery images={packImages(pack)} name={name} locale={locale} />

        <div className="reveal" style={{ '--reveal-delay': '120ms' } as CSSProperties}>
          <span className="inline-block bg-primary text-on-primary px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide mb-3">
            {dict.packs.badge}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
            {name}
          </h1>

          <div className="flex items-center flex-wrap gap-3 mt-4">
            <span className="font-display text-3xl font-semibold text-primary">
              {formatPrice(pack.price, dict.common.currency)}
            </span>
            {saving > 0 && (
              <span className="text-xl text-outline line-through">
                {formatPrice(pack.regularPrice, dict.common.currency)}
              </span>
            )}
            {pack.discountPercentage != null && (
              <span className="bg-wood text-primary px-2.5 py-1 rounded text-xs font-bold">
                -{pack.discountPercentage}%
              </span>
            )}
          </div>
          {saving > 0 && (
            <p className="text-sm font-semibold text-primary mt-2">
              {dict.packs.save} {formatPrice(saving, dict.common.currency)}
            </p>
          )}

          {description && (
            <p className="text-on-surface-variant leading-relaxed mt-6 whitespace-pre-line">
              {description}
            </p>
          )}

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
              {dict.packs.contents}
            </h2>
            <ul className="flex flex-col border-t hairline">
              {pack.items.map((item) => {
                const itemName = localize(locale, item.nameAr, item.nameFr);
                return (
                  <li key={item.productId} className="border-b hairline">
                    <Link
                      href={`/products/${item.slug}`}
                      className="flex items-center gap-4 py-3 group"
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-low">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={itemName}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium group-hover:text-primary">
                          <span className="text-primary font-semibold">
                            {item.quantity}×
                          </span>{' '}
                          {itemName}
                        </span>
                        <span className="block text-sm text-on-surface-variant">
                          {formatPrice(item.unitPrice, dict.common.currency)}
                          {item.quantity > 1 &&
                            ` × ${item.quantity} = ${formatPrice(
                              item.unitPrice * item.quantity,
                              dict.common.currency,
                            )}`}
                        </span>
                      </span>
                      <Icon
                        name="chevron_left"
                        className="flip-rtl !text-[18px] text-outline"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {saving > 0 && (
              <p className="text-sm text-on-surface-variant mt-3">
                {dict.packs.separately}{' '}
                <span className="line-through">
                  {formatPrice(pack.regularPrice, dict.common.currency)}
                </span>
              </p>
            )}
          </section>

          <ProductPurchase dict={dict} item={cartItem} />

          <TrustRow dict={dict} />

          <div className="mt-10 border-t hairline">
            <Accordion title={dict.product.delivery} defaultOpen>
              {dict.product.deliveryBody}
            </Accordion>
          </div>
        </div>
      </div>

      <StickyBuyBar dict={dict} item={cartItem} name={name} watchId="buy-box" />

      {others.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-12 reveal">
            {dict.packs.others}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {others.map((other, i) => (
              <PackCard
                key={other.slug}
                pack={other}
                locale={locale}
                dict={dict}
                index={i}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n, getLocale } from '@/lib/i18n/server';
import { localize, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getProduct, getRelatedProducts } from '@/lib/api/products';
import { formatPrice } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { Accordion } from '@/components/product/Accordion';
import { ProductCard } from '@/components/product/ProductCard';
import { TrustRow } from '@/components/product/TrustRow';
import { StickyBuyBar } from '@/components/product/StickyBuyBar';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
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
  const product = await getProduct(slug);

  if (!product) {
    return { title: dict.product.outOfStock, robots: { index: false } };
  }

  const name = localize(locale, product.nameAr, product.nameFr);
  const description =
    localize(locale, product.shortDescriptionAr, product.shortDescriptionFr) ||
    localize(locale, product.descriptionAr, product.descriptionFr) ||
    dict.hero.subtitle;
  const image = product.primaryImage?.url;
  const url = `/products/${product.slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description,
      url,
      type: 'website',
      images: image ? [{ url: image, alt: name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function productJsonLd(
  locale: Locale,
  name: string,
  description: string,
  product: NonNullable<Awaited<ReturnType<typeof getProduct>>>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: product.images.map((img) => img.url),
    brand: { '@type': 'Brand', name: 'Darar' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'TND',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/products/${product.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, dict } = await getI18n();
  const product = await getProduct(slug);
  if (!product) notFound();

  const name = localize(locale, product.nameAr, product.nameFr);
  const categoryName = product.category
    ? localize(locale, product.category.nameAr, product.category.nameFr)
    : null;
  const shortDescription = localize(
    locale,
    product.shortDescriptionAr,
    product.shortDescriptionFr,
  );
  const longDescription = localize(
    locale,
    product.descriptionAr,
    product.descriptionFr,
  );

  const cartItem = {
    slug: product.slug,
    nameAr: product.nameAr,
    nameFr: product.nameFr,
    price: product.price,
    image: product.primaryImage?.url ?? null,
  };

  const related = await getRelatedProducts(
    product.category?.slug,
    product.slug,
    4,
  ).catch(() => []);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.product.home, item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: dict.nav.shop,
        item: `${siteUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: `${siteUrl}/products/${product.slug}`,
      },
    ],
  };

  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-24 lg:pt-28 pb-20">
      <JsonLd
        data={productJsonLd(
          locale,
          name,
          shortDescription || longDescription || name,
          product,
        )}
      />
      <JsonLd data={breadcrumbJsonLd} />

      <nav
        className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant mb-8"
        aria-label="breadcrumb"
      >
        <Link href="/" className="hover:text-primary">
          {dict.product.home}
        </Link>
        <Icon name="chevron_left" className="flip-rtl !text-[16px]" />
        <Link href="/shop" className="hover:text-primary">
          {dict.nav.shop}
        </Link>
        {product.category && (
          <>
            <Icon name="chevron_left" className="flip-rtl !text-[16px]" />
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-primary"
            >
              {categoryName}
            </Link>
          </>
        )}
        <Icon name="chevron_left" className="flip-rtl !text-[16px]" />
        <span className="text-on-surface font-medium">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
        <ProductGallery images={product.images} name={name} locale={locale} />

        <div className="reveal" style={{ '--reveal-delay': '120ms' } as CSSProperties}>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
            {name}
          </h1>
          {categoryName && (
            <p className="text-on-surface-variant mt-1">{categoryName}</p>
          )}

          <div className="flex items-center flex-wrap gap-3 mt-4">
            <span className="font-display text-3xl font-semibold text-primary">
              {formatPrice(product.price, dict.common.currency)}
            </span>
            {product.oldPrice != null && (
              <span className="text-xl text-outline line-through">
                {formatPrice(product.oldPrice, dict.common.currency)}
              </span>
            )}
            {product.discountPercentage != null && (
              <span className="bg-wood text-primary px-2.5 py-1 rounded text-xs font-bold">
                -{product.discountPercentage}%
              </span>
            )}
          </div>

          {shortDescription && (
            <p className="text-on-surface-variant leading-relaxed mt-6 whitespace-pre-line">
              {shortDescription}
            </p>
          )}

          <ProductPurchase dict={dict} item={cartItem} />

          <TrustRow dict={dict} />

          <div className="mt-10 border-t hairline">
            {longDescription && (
              <Accordion title={dict.product.details} defaultOpen>
                <p className="whitespace-pre-line">{longDescription}</p>
              </Accordion>
            )}
            <Accordion title={dict.product.delivery}>
              {dict.product.deliveryBody}
            </Accordion>
          </div>
        </div>
      </div>

      <StickyBuyBar dict={dict} item={cartItem} name={name} watchId="buy-box" />

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-12 reveal">
            {dict.product.related}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((item, i) => (
              <ProductCard
                key={item.slug}
                product={item}
                locale={locale}
                dict={dict}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed
        locale={locale}
        dict={dict}
        slug={product.slug}
        nameAr={product.nameAr}
        nameFr={product.nameFr}
        price={product.price}
        image={product.primaryImage?.url ?? null}
      />
    </main>
  );
}

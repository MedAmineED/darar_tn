import { getI18n } from '@/lib/i18n/server';
import { getCategories } from '@/lib/api/categories';
import { getFeaturedProducts } from '@/lib/api/products';
import type { StorefrontCategory, StorefrontProduct } from '@/lib/api/types';
import { Hero } from '@/components/home/Hero';
import { Marquee } from '@/components/home/Marquee';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Story } from '@/components/home/Story';
import { Newsletter } from '@/components/home/Newsletter';
import { PackOffers } from '@/components/packs/PackOffers';
import { getPacks, type StorefrontPack } from '@/lib/api/packs';

export default async function HomePage() {
  const { locale, dict } = await getI18n();

  // Static sections must render even if the API is unavailable.
  const [categories, featured, packs] = await Promise.all([
    getCategories().catch((): StorefrontCategory[] => []),
    getFeaturedProducts(4).catch((): StorefrontProduct[] => []),
    getPacks().catch((): StorefrontPack[] => []),
  ]);

  return (
    <main id="main">
      <Hero dict={dict} />
      <Marquee dict={dict} />
      <CategoryGrid categories={categories} locale={locale} dict={dict} />
      <FeaturedProducts products={featured} locale={locale} dict={dict} />
      <PackOffers packs={packs} locale={locale} dict={dict} limit={3} />
      <Story dict={dict} />
      <Newsletter dict={dict} />
    </main>
  );
}

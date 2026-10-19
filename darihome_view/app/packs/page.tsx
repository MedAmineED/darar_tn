import type { Metadata } from 'next';
import { getI18n } from '@/lib/i18n/server';
import { getPacks, type StorefrontPack } from '@/lib/api/packs';
import { PackOffers } from '@/components/packs/PackOffers';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.packs.title,
    description: dict.packs.subtitle,
    alternates: { canonical: '/packs' },
  };
}

export default async function PacksPage() {
  const { locale, dict } = await getI18n();
  const packs = await getPacks().catch((): StorefrontPack[] => []);
  return (
    <main id="main" className="pt-6 pb-16 min-h-[50vh]">
      {packs.length ? (
        <PackOffers packs={packs} locale={locale} dict={dict} />
      ) : (
        <p className="max-w-container mx-auto px-5 md:px-16 py-20 text-center text-on-surface-variant">
          {dict.packs.empty}
        </p>
      )}
    </main>
  );
}

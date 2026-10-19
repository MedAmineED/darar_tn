import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { StorefrontPack } from '@/lib/api/packs';
import { Icon } from '@/components/ui/Icon';
import { PackCard } from './PackCard';

export function PackOffers({
  packs,
  locale,
  dict,
  limit,
}: {
  packs: StorefrontPack[];
  locale: Locale;
  dict: Dictionary;
  limit?: number;
}) {
  if (packs.length === 0) return null;
  const shown = limit ? packs.slice(0, limit) : packs;
  return (
    <section id="packs" className="py-8 md:py-12">
      <div className="max-w-container mx-auto px-5 md:px-16">
        <div className="flex items-end justify-between gap-6 mb-10 reveal">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              {dict.packs.title}
            </h2>
            <p className="text-on-surface-variant mt-3">
              {dict.packs.subtitle}
            </p>
          </div>
          {limit && packs.length > limit && (
            <Link
              href="/packs"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary shrink-0 nav-link"
            >
              <span>{dict.packs.viewAll}</span>
              <Icon name="arrow_forward" className="flip-rtl !text-[18px]" />
            </Link>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {shown.map((pack, i) => (
            <PackCard
              key={pack.id}
              pack={pack}
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

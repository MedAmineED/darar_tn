'use client';

import { Languages } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <button
      type="button"
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      onClick={() => setLocale(locale === 'ar' ? 'fr' : 'ar')}
      aria-label={t('التبديل إلى الفرنسية', 'Passer en arabe')}
      title={t('التبديل إلى الفرنسية', 'Passer en arabe')}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span lang={locale === 'ar' ? 'fr' : 'ar'}>
        {locale === 'ar' ? 'FR' : 'العربية'}
      </span>
    </button>
  );
}

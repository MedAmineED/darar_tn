'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';
import { clsx } from '@/lib/clsx';

/**
 * Language switcher. Persists the choice in a cookie the server reads, then
 * refreshes so the whole page re-renders (SSR-correct) in the new language —
 * the React port of the template's client-side DariI18n.toggle().
 */
export function LangToggle({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next: Locale = locale === 'ar' ? 'fr' : 'ar';
    // 1 year, lax — non-sensitive UI preference.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label="Language"
      className={clsx(className, isPending && 'opacity-60')}
    >
      {label}
    </button>
  );
}

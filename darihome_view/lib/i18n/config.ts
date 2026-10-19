export const locales = ['ar', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

/** Cookie that persists the visitor's language choice (read server-side). */
export const LOCALE_COOKIE = 'darihome_lang';

export const dir: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  fr: 'ltr',
};

export function isLocale(value: string | undefined): value is Locale {
  return value === 'ar' || value === 'fr';
}

/** Localized "N products" label (kept out of the dictionary so dictionaries
 * stay plain-serializable and can cross the Server→Client boundary). */
export function productCountLabel(locale: Locale, n: number): string {
  return locale === 'ar' ? `${n} منتج` : `${n} produit${n > 1 ? 's' : ''}`;
}

/** Pick the Arabic or French value for the active locale. */
export function localize(
  locale: Locale,
  ar: string | null | undefined,
  fr: string | null | undefined,
): string {
  const primary = locale === 'ar' ? ar : fr;
  const fallback = locale === 'ar' ? fr : ar;
  return (primary || fallback || '').toString();
}

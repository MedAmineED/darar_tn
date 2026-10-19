/** Non-React helpers (API errors and number formatting) share the current UI locale. */
export type AdminLocale = 'ar' | 'fr';
let currentLocale: AdminLocale = 'ar';
export function getCurrentLocale(): AdminLocale {
  return currentLocale;
}
export function setCurrentLocale(locale: AdminLocale): void {
  currentLocale = locale;
}

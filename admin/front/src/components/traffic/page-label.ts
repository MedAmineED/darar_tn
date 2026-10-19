import type { ProductRef } from '@/lib/api/traffic';

const STATIC: Record<string, [string, string]> = {
  '/': ['الصفحة الرئيسية', 'Accueil'],
  '/shop': ['المتجر', 'Boutique'],
  '/packs': ['عروض الباقات', 'Packs'],
  '/checkout': ['إتمام الطلب', 'Commande'],
};

/** Human label for a storefront path (product pages show the product name). */
export function pageLabel(
  path: string,
  product: ProductRef | null,
  locale: 'ar' | 'fr',
): string {
  if (product) return locale === 'ar' ? product.nameAr : product.nameFr;
  const known = STATIC[path];
  return known ? known[locale === 'ar' ? 0 : 1] : path;
}

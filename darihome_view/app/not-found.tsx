import Link from 'next/link';
import { getI18n } from '@/lib/i18n/server';

export default async function NotFound() {
  const { locale, dict } = await getI18n();
  const title = locale === 'ar' ? 'الصفحة غير موجودة' : 'Page introuvable';
  const body =
    locale === 'ar'
      ? 'الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.'
      : 'La page que vous cherchez est introuvable ou a été déplacée.';
  const cta = locale === 'ar' ? 'العودة إلى المتجر' : 'Retour à la boutique';

  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-32 pb-24 min-h-[60vh] grid place-items-center text-center">
      <div>
        <p className="font-display text-7xl font-bold text-wood">404</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary mt-4">
          {title}
        </h1>
        <p className="text-on-surface-variant mt-3 max-w-md mx-auto">{body}</p>
        <Link href="/shop" className="btn btn-primary px-8 py-4 text-sm mt-8">
          {cta}
        </Link>
        <p className="sr-only">{dict.brand.name}</p>
      </div>
    </main>
  );
}

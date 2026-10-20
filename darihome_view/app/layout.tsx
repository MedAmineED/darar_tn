import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display, Amiri, Tajawal } from 'next/font/google';
import { getI18n } from '@/lib/i18n/server';
import { getDeliverySettings } from '@/lib/api/delivery';
import { dir } from '@/lib/i18n/config';
import { clsx } from '@/lib/clsx';
import { CartProvider } from '@/components/cart/CartProvider';
import { DeliveryProvider } from '@/components/cart/DeliveryProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tracker } from '@/components/analytics/Tracker';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import { PIXEL_ID, pixelSnippet } from '@/lib/pixel';

// Storefront must reflect admin changes immediately: force dynamic SSR on
// every request and never cache upstream API fetches (no static/ISR cache).
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});
const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});
const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getI18n();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${dict.meta.siteName} — ${dict.meta.homeTitle}`,
      template: `%s — ${dict.meta.siteName}`,
    },
    description: dict.hero.subtitle,
    applicationName: dict.meta.siteName,
    alternates: { canonical: '/' },
    openGraph: {
      siteName: dict.meta.siteName,
      type: 'website',
      locale: locale === 'ar' ? 'ar_TN' : 'fr_FR',
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getI18n();
  const delivery = await getDeliverySettings();
  return (
    <html
      lang={locale}
      dir={dir[locale]}
      className={clsx(
        inter.variable,
        playfair.variable,
        amiri.variable,
        tajawal.variable,
      )}
    >
      {PIXEL_ID && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: pixelSnippet(PIXEL_ID) }} />
        </head>
      )}
      <body className="font-body bg-surface text-on-surface">
        <DeliveryProvider value={delivery}>
          <CartProvider>
            <Header locale={locale} dict={dict} />
            {children}
            <Footer dict={dict} />
            <CartDrawer locale={locale} dict={dict} />
            <ScrollReveal />
            <Tracker />
            <MetaPixel />
          </CartProvider>
        </DeliveryProvider>
      </body>
    </html>
  );
}

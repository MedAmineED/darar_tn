import type { Metadata } from 'next';
import { getI18n } from '@/lib/i18n/server';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  // Checkout is a transactional page — keep it out of the index.
  return { title: dict.checkout.title, robots: { index: false, follow: false } };
}

export default async function CheckoutPage() {
  const { locale, dict } = await getI18n();
  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-24 lg:pt-28 pb-20">
      <h1 className="font-display text-4xl md:text-5xl font-semibold mb-10">
        {dict.checkout.title}
      </h1>
      <CheckoutForm locale={locale} dict={dict} />
    </main>
  );
}

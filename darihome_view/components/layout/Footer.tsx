import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="bg-surface-variant pt-16 pb-8">
      <div className="max-w-container mx-auto px-5 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-bold">
              {dict.brand.name}
            </Link>
            <p className="text-sm text-on-surface-variant mt-3 max-w-[220px]">
              {dict.footer.tagline}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
              {dict.footer.colShop}
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.all}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.furniture}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.accessories}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
              {dict.footer.colService}
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.faq}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.shipping}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.care}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
              {dict.footer.colContact}
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link
                  href="/#newsletter"
                  className="hover:text-primary transition-colors"
                >
                  {dict.footer.getInTouch}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {dict.footer.stores}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t hairline mt-12 pt-6 text-center">
          <p className="text-sm text-on-surface-variant">{dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}

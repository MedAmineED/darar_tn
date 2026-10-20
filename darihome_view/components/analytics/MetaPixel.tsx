'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PIXEL_ID, PIXEL_CURRENCY, track } from '@/lib/pixel';

/**
 * Client-side navigations don't reload the page, so the base snippet's
 * PageView only covers the landing page. This sends one per later route.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (first.current) {
      first.current = false;
      return;
    }
    track('PageView');
  }, [pathname]);

  return null;
}

/** ViewContent for a product page. */
export function TrackViewContent({
  slug,
  name,
  price,
}: {
  slug: string;
  name: string;
  price: number;
}) {
  useEffect(() => {
    track('ViewContent', {
      content_type: 'product',
      content_ids: [slug],
      content_name: name,
      value: price,
      currency: PIXEL_CURRENCY,
    });
  }, [slug, name, price]);

  return null;
}

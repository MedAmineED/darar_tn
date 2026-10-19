'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { buildShopHref, type ShopParams } from '@/lib/shop';
import { Icon } from '@/components/ui/Icon';

/**
 * Product search. Submitting sets the `search` URL param; the backend matches
 * it against both Arabic and French names, so typing in either language finds
 * the product. Server-rendered results, so it works and stays crawlable.
 */
export function ShopSearch({
  params,
  dict,
}: {
  params: ShopParams;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [value, setValue] = useState(params.search ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(buildShopHref(params, { search: q || undefined, page: 1 }));
  };

  return (
    <form onSubmit={submit} role="search" className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={dict.shop.search}
        aria-label={dict.shop.search}
        className="w-full rounded border border-outline-variant bg-white ps-10 pe-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <Icon
        name="search"
        className="absolute top-1/2 -translate-y-1/2 start-3 !text-[18px] text-outline pointer-events-none"
      />
    </form>
  );
}

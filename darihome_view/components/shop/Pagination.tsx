import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { PaginationMeta } from '@/lib/api/types';
import { buildShopHref, type ShopParams } from '@/lib/shop';
import { Icon } from '@/components/ui/Icon';
import { clsx } from '@/lib/clsx';

function pageWindow(current: number, total: number): (number | 'gap')[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('gap');
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  meta,
  params,
  dict,
}: {
  meta: PaginationMeta;
  params: ShopParams;
  dict: Dictionary;
}) {
  if (meta.totalPages <= 1) return null;
  const items = pageWindow(meta.page, meta.totalPages);

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-14"
      aria-label="pagination"
    >
      {meta.hasPreviousPage ? (
        <Link
          href={buildShopHref(params, { page: meta.page - 1 })}
          aria-label={dict.shop.prev}
          className="h-10 w-10 grid place-items-center rounded hover:bg-surface-high transition-colors"
        >
          <Icon name="chevron_right" className="flip-rtl" />
        </Link>
      ) : (
        <span className="h-10 w-10 grid place-items-center rounded text-outline-variant">
          <Icon name="chevron_right" className="flip-rtl" />
        </span>
      )}

      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-outline">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildShopHref(params, { page: item })}
            aria-current={item === meta.page ? 'page' : undefined}
            className={clsx(
              'h-10 w-10 grid place-items-center rounded transition-colors',
              item === meta.page
                ? 'bg-primary text-on-primary font-semibold'
                : 'hover:bg-surface-high',
            )}
          >
            {item}
          </Link>
        ),
      )}

      {meta.hasNextPage ? (
        <Link
          href={buildShopHref(params, { page: meta.page + 1 })}
          aria-label={dict.shop.next}
          className="h-10 w-10 grid place-items-center rounded hover:bg-surface-high transition-colors"
        >
          <Icon name="chevron_left" className="flip-rtl" />
        </Link>
      ) : (
        <span className="h-10 w-10 grid place-items-center rounded text-outline-variant">
          <Icon name="chevron_left" className="flip-rtl" />
        </span>
      )}
    </nav>
  );
}

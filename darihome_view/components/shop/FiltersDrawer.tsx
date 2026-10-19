'use client';

import { useEffect, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '@/components/ui/Icon';
import { clsx } from '@/lib/clsx';

/**
 * Mobile filters drawer. The filter controls themselves are server-rendered
 * links passed in as `children`; this only handles open/close. Ported from
 * initFilters() in the template's main.js.
 */
export function FiltersDrawer({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden btn btn-ghost text-primary px-5 py-2.5 text-sm"
        aria-expanded={open}
      >
        <Icon name="tune" className="!text-[20px]" />
        <span>{dict.shop.filters}</span>
      </button>

      <div
        onClick={() => setOpen(false)}
        className={clsx('scrim fixed inset-0 z-50 bg-black/40 lg:hidden', open && 'is-open')}
      />
      <aside
        className={clsx(
          'drawer fixed top-0 end-0 z-[55] h-full w-[85%] max-w-sm bg-surface shadow-2xl lg:hidden flex flex-col',
          open && 'is-open',
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b hairline shrink-0">
          <span className="font-display text-xl font-bold">{dict.shop.filters}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={dict.nav.close}
            className="h-10 w-10 inline-flex items-center justify-center rounded hover:bg-black/5"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6" onClick={() => setOpen(false)}>
          {children}
        </div>
        <div className="px-6 py-5 border-t hairline shrink-0">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full py-3.5 text-sm"
          >
            {dict.shop.apply}
          </button>
        </div>
      </aside>
    </>
  );
}

'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { clsx } from '@/lib/clsx';

/** Animated disclosure, ported from initAccordions() in the template's main.js. */
export function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx('accordion border-b hairline', open && 'is-open')}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-start"
      >
        <span className="text-xs font-semibold uppercase tracking-widest">
          {title}
        </span>
        <Icon name="expand_more" className="accordion-icon" />
      </button>
      <div className="accordion-body">
        <div>
          <div className="pb-6 text-sm text-on-surface-variant leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

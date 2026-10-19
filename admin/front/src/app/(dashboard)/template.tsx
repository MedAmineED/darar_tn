'use client';

import { m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/** Next templates replay once per route, without retaining stale page trees. */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <m.div
      className="min-w-0"
      data-page-transition
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </m.div>
  );
}

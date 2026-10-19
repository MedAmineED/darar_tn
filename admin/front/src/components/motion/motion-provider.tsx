'use client';

import {
  LazyMotion,
  MotionConfig,
  domMax,
  useReducedMotion,
} from 'motion/react';
import type { ReactNode } from 'react';

/** A shared, quiet motion language. The OS preference removes all travel and delay. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: reducedMotion ? 0 : 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

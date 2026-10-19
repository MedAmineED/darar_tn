'use client';

import { useEffect, useRef } from 'react';
import {
  AnimatePresence,
  m,
  useIsPresent,
  useReducedMotion,
  type HTMLMotionProps,
} from 'motion/react';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { useLocale } from '@/contexts/locale-context';

export function MobileNavigation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const reducedMotion = useReducedMotion();
  const closeButton = useRef<HTMLButtonElement>(null);
  const offset = locale === 'ar' ? 24 : -24;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <NavigationSurface
          key="mobile-navigation"
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('قائمة التنقل', 'Navigation')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            if (event.key !== 'Tab') return;
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                'a[href], button:not([tabindex="-1"])',
              ),
            );
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
        >
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 bg-black/40"
            aria-label={t('إغلاق قائمة التنقل', 'Fermer la navigation')}
            onClick={onClose}
          />
          <m.div
            className="relative h-full max-w-[85vw]"
            initial={reducedMotion ? false : { x: offset }}
            animate={{ x: 0 }}
            exit={reducedMotion ? {} : { x: offset }}
          >
            <Sidebar onNavigate={onClose} />
            <button
              ref={closeButton}
              type="button"
              aria-label={t('إغلاق القائمة', 'Fermer le menu')}
              onClick={onClose}
              className="absolute end-2 top-4 rounded bg-surface-lowest p-2 text-on-surface-variant hover:bg-surface-container"
            >
              <X className="h-4 w-4" />
            </button>
          </m.div>
        </NavigationSurface>
      )}
    </AnimatePresence>
  );
}

/** An exiting backdrop must not swallow the user's next click. */
function NavigationSurface({ children, ...props }: HTMLMotionProps<'div'>) {
  const present = useIsPresent();
  return (
    <m.div
      {...props}
      data-navigation-presence={present ? 'open' : 'closing'}
      style={{ pointerEvents: present ? 'auto' : 'none' }}
      inert={!present}
      aria-hidden={!present || undefined}
    >
      {children}
    </m.div>
  );
}

'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  m,
  useIsPresent,
  useReducedMotion,
} from 'motion/react';
import { X } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Portals keep fixed overlays outside animated route containers. */
export function Modal({ open, ...props }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence propagate>
      {open && <ModalSurface key="dialog" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}

function ModalSurface({
  onClose,
  title,
  children,
  className,
}: Omit<ModalProps, 'open'>) {
  const { t } = useLocale();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!present) return;
    const previous = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [present]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!present) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      panel.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      ) ?? [],
    ).filter((element) => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === panel.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === panel.current)
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-modal-presence={present ? 'open' : 'closing'}
      style={{ pointerEvents: present ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={present ? undefined : { duration: reducedMotion ? 0 : 0.14 }}
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => present && onClose()}
        aria-hidden
      />
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!present || undefined}
        inert={!present}
        tabIndex={-1}
        initial={reducedMotion ? false : { y: 12, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={reducedMotion ? {} : { y: 6, scale: 0.985 }}
        transition={
          present ? undefined : { duration: reducedMotion ? 0 : 0.14 }
        }
        className={cn(
          'relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-outline-variant bg-surface-lowest shadow-popover outline-none',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h2
            id={titleId}
            className="font-heading text-lg font-semibold text-on-surface"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-on-surface-variant hover:bg-surface-container"
            aria-label={t('إغلاق', 'Fermer')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </m.div>
    </m.div>
  );
}

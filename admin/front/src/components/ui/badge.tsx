import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-container text-on-surface-variant',
  success: 'bg-tertiary-container/15 text-tertiary',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-error-container text-error-on-container',
  info: 'bg-primary-container/15 text-primary-container',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

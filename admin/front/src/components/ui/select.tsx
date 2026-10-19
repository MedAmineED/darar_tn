import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border bg-surface-lowest px-3 text-[13px] text-on-surface',
        'focus:outline-none focus:ring-2 focus:ring-primary-container/40',
        hasError
          ? 'border-error focus:border-error'
          : 'border-outline-variant/70 focus:border-primary-container',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = 'Select';

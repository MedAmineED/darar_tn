import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border bg-surface-lowest px-3 text-[13px] text-on-surface',
        'placeholder:text-on-surface-variant/50',
        'focus:outline-none focus:ring-2 focus:ring-primary-container/40',
        hasError
          ? 'border-error focus:border-error focus:ring-error/30'
          : 'border-outline-variant/70 focus:border-primary-container',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

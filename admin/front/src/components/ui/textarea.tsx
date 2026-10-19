import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border bg-surface-lowest px-3 py-2 text-sm text-on-surface',
        'placeholder:text-on-surface-variant/50',
        'focus:outline-none focus:ring-2 focus:ring-primary-container/40',
        hasError
          ? 'border-error focus:border-error'
          : 'border-outline-variant focus:border-primary-container',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

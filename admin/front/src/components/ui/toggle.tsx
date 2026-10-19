'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-150 motion-reduce:transition-none',
          checked ? 'bg-primary-container' : 'bg-outline-variant',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none',
            checked ? 'translate-x-0' : 'translate-x-5 rtl:-translate-x-5',
          )}
        />
      </button>
      {label && <span className="text-sm text-on-surface">{label}</span>}
    </label>
  );
}

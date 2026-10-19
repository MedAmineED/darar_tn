import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-5 w-5 animate-spin text-primary', className)} />
  );
}

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm text-on-surface-variant">{label}</p>}
    </div>
  );
}

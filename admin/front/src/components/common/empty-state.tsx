import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container">
        <Icon className="h-7 w-7 text-on-surface-variant" />
      </div>
      <p className="text-sm text-on-surface-variant">{message}</p>
      {action}
    </div>
  );
}

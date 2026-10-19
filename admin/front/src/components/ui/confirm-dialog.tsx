'use client';

import { Modal } from './modal';
import { Button } from './button';
import { useLocale } from '@/contexts/locale-context';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { strings } = useLocale();
  return (
    <Modal open={open} onClose={onCancel} title={title} className="max-w-md">
      <p className="text-sm text-on-surface-variant">{message}</p>
      <div className="mt-6 flex justify-start gap-3">
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel ?? strings.common.delete}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {strings.common.cancel}
        </Button>
      </div>
    </Modal>
  );
}

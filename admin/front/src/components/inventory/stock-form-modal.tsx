'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { InventoryItem } from '@/lib/api/inventory';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAdjustStock, useUpdateStockThreshold } from '@/hooks/use-inventory';
import { useLocale } from '@/contexts/locale-context';

export function StockFormModal({
  item,
  mode,
  onClose,
}: {
  item: InventoryItem;
  mode: 'adjustment' | 'threshold' | 'receipt';
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const [delta, setDelta] = useState('');
  const [threshold, setThreshold] = useState(
    mode === 'threshold' ? String(item.lowStockThreshold) : '',
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const adjust = useAdjustStock();
  const updateThreshold = useUpdateStockThreshold();
  const pending = adjust.isPending || updateThreshold.isPending;
  const isAdjustment = mode !== 'threshold';
  const isReceipt = mode === 'receipt';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const trimmedReason = reason.trim();
    const change = Number(delta);
    const level = threshold.trim() === '' ? undefined : Number(threshold);
    if (!trimmedReason || trimmedReason.length > 500) {
      setError(
        t(
          'أدخل سببًا واضحًا من 1 إلى 500 حرف.',
          'Indiquez un motif de 1 à 500 caractères.',
        ),
      );
      return;
    }
    if (
      isAdjustment &&
      (delta.trim() === '' ||
        !Number.isInteger(change) ||
        change === 0 ||
        (isReceipt && change < 1) ||
        Math.abs(change) > 1000000000)
    ) {
      setError(
        isReceipt
          ? t(
              'أدخل كمية صحيحة موجبة حتى 1000000000.',
              'Indiquez une quantité entière positive, jusqu’à 1 000 000 000.',
            )
          : t(
              'أدخل عددًا صحيحًا غير صفر بين -1000000000 و1000000000.',
              'Indiquez un entier non nul entre -1 000 000 000 et 1 000 000 000.',
            ),
      );
      return;
    }
    if (
      (!isAdjustment && level === undefined) ||
      (level !== undefined &&
        (!Number.isInteger(level) || level < 0 || level > 1000000000))
    ) {
      setError(
        t(
          'حد التنبيه عدد صحيح بين 0 و1000000000.',
          'Le seuil doit être un entier entre 0 et 1 000 000 000.',
        ),
      );
      return;
    }
    try {
      if (isAdjustment)
        await adjust.mutateAsync({
          productId: item.productId,
          input: {
            delta: change,
            reason: trimmedReason,
            ...(level === undefined ? {} : { lowStockThreshold: level }),
          },
        });
      else if (level !== undefined)
        await updateThreshold.mutateAsync({
          productId: item.productId,
          input: { lowStockThreshold: level, reason: trimmedReason },
        });
      toast.success(
        isAdjustment
          ? t(
              'تم تعديل المخزون وتسجيل الحركة',
              'Stock mis à jour et mouvement enregistré',
            )
          : t('تم تحديث حد التنبيه', 'Seuil d’alerte mis à jour'),
      );
      onClose();
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    }
  };

  return (
    <Modal
      open
      onClose={() => {
        if (!pending) onClose();
      }}
      title={
        isReceipt
          ? t('استلام مخزون', 'Réceptionner du stock')
          : isAdjustment
            ? t('تعديل رصيد المخزون', 'Ajuster le stock')
            : t('تعديل حد التنبيه', 'Modifier le seuil d’alerte')
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded bg-surface-container p-3 text-sm">
          <p className="font-semibold">
            {locale === 'fr' ? item.product.nameFr : item.product.nameAr}
          </p>
          <p className="mt-1 text-on-surface-variant">
            {t('الرصيد الحالي', 'Stock actuel')}:{' '}
            <b dir="ltr">{item.quantity}</b> ·{' '}
            {t('حد التنبيه', 'Seuil d’alerte')}:{' '}
            <b dir="ltr">{item.lowStockThreshold}</b>
          </p>
        </div>
        {isAdjustment && (
          <div>
            <Label htmlFor="stock-delta">
              {isReceipt
                ? t('الكمية المستلمة', 'Quantité reçue')
                : t('تغيير الكمية', 'Variation de quantité')}
            </Label>
            <Input
              id="stock-delta"
              type="number"
              dir="ltr"
              step={1}
              min={isReceipt ? 1 : -1000000000}
              max={1000000000}
              required
              value={delta}
              onChange={(event) => setDelta(event.target.value)}
              disabled={pending}
              placeholder={isReceipt ? '10' : '+10 / -2'}
            />
            <p className="mt-1 text-xs text-on-surface-variant">
              {isReceipt
                ? t(
                    'أدخل عدد الوحدات المستلمة لإضافتها إلى الرصيد.',
                    'Nombre d’unités reçues à ajouter au stock.',
                  )
                : t(
                    'عدد موجب للإضافة أو سالب للخصم. لا يمكن أن يصبح الرصيد سالبًا.',
                    'Positif pour ajouter, négatif pour retirer. Le stock ne peut pas devenir négatif.',
                  )}
            </p>
            {delta.trim() && Number.isInteger(Number(delta)) && (
              <p className="mt-3 rounded border border-primary/20 bg-primary/5 p-3 text-sm font-medium">
                {t('الرصيد بعد العملية', 'Stock après opération')} :{' '}
                <bdi dir="ltr">{item.quantity + Number(delta)}</bdi>
              </p>
            )}
          </div>
        )}
        <div>
          <Label htmlFor="stock-threshold">
            {t('حد التنبيه بالمخزون المنخفض', 'Seuil de stock faible')}{' '}
            {isAdjustment ? t('(اختياري)', '(facultatif)') : ''}
          </Label>
          <Input
            id="stock-threshold"
            type="number"
            dir="ltr"
            step={1}
            min={0}
            max={1000000000}
            required={!isAdjustment}
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            disabled={pending}
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            {isAdjustment
              ? t(
                  'اتركه فارغًا للإبقاء على الحد الحالي. ',
                  'Laissez vide pour conserver le seuil actuel. ',
                )
              : ''}
            {t(
              'يظهر التنبيه عندما يكون الرصيد أكبر من صفر وأقل من أو يساوي هذا الحد.',
              'Une alerte apparaît lorsque le stock est positif et inférieur ou égal au seuil.',
            )}
          </p>
        </div>
        <div>
          <Label htmlFor="stock-reason">
            {t('سبب التغيير', 'Motif du mouvement')}
          </Label>
          <Textarea
            id="stock-reason"
            rows={3}
            required
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            placeholder={t(
              'مثال: جرد فعلي أو استلام دفعة جديدة',
              'Ex. : livraison fournisseur ou inventaire physique',
            )}
          />
        </div>
        {error && (
          <p
            role="alert"
            className="rounded bg-error-container p-3 text-sm text-error-on-container"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            {t('إلغاء', 'Annuler')}
          </Button>
          <Button type="submit" isLoading={pending}>
            {isReceipt
              ? t('تسجيل الاستلام', 'Enregistrer la réception')
              : t('حفظ التغيير', 'Enregistrer')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

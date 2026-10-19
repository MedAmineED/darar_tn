'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  useDeliverySettings,
  useUpdateDeliverySettings,
} from '@/hooks/use-settings';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsPage() {
  const { strings } = useLocale();
  const s = strings.settings;
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('setting:update');

  const { data, isLoading } = useDeliverySettings();
  const update = useUpdateDeliverySettings();

  const [fee, setFee] = useState('');
  const [threshold, setThreshold] = useState('');

  useEffect(() => {
    if (data) {
      setFee(String(data.fee));
      setThreshold(String(data.freeShippingThreshold));
    }
  }, [data]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const feeNum = Number(fee);
    const thresholdNum = Number(threshold);
    if (
      !Number.isFinite(feeNum) ||
      feeNum < 0 ||
      !Number.isFinite(thresholdNum) ||
      thresholdNum < 0
    ) {
      toast.error(s.invalid);
      return;
    }
    try {
      await update.mutateAsync({
        fee: feeNum,
        freeShippingThreshold: thresholdNum,
      });
      toast.success(s.saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader title={s.title} />
      <Card className="max-w-lg p-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-on-surface">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{s.delivery}</h2>
            </div>
            <p className="-mt-3 text-sm text-on-surface-variant">
              {s.deliveryDesc}
            </p>

            <div>
              <Label htmlFor="fee">{s.fee}</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                dir="ltr"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                disabled={!canWrite}
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                {s.feeHint}
              </p>
            </div>

            <div>
              <Label htmlFor="threshold">{s.threshold}</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                dir="ltr"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                disabled={!canWrite}
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                {s.thresholdHint}
              </p>
            </div>

            {canWrite && (
              <div>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? <Spinner className="h-4 w-4" /> : s.save}
                </Button>
              </div>
            )}
          </form>
        )}
      </Card>
    </div>
  );
}

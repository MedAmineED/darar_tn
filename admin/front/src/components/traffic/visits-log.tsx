'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/locale-context';
import { useTrafficSessions } from '@/hooks/use-traffic';
import type { DashboardRange } from '@/lib/api/dashboard';
import { flag, placeLabel } from '@/lib/geo-names';
import { cn } from '@/lib/utils';
import { pageLabel } from './page-label';

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

function time(iso: string): string {
  // Tunis wall clock (UTC+1), Western numerals.
  return new Date(Date.parse(iso) + 3_600_000)
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');
}

function duration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/** Each visit with its place, device, source and the pages it went through. */
export function VisitsLog({
  range,
  countries,
}: {
  range: DashboardRange;
  countries: string[];
}) {
  const { t, locale } = useLocale();
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState('');
  const [device, setDevice] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useTrafficSessions({
    ...range,
    page,
    limit: 15,
    country: country || undefined,
    device: device || undefined,
  });

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{t('سجلّ الزيارات', 'Journal des visites')}</CardTitle>
        <div className="flex gap-2">
          <Select
            className="w-40"
            aria-label={t('الدولة', 'Pays')}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('كل الدول', 'Tous les pays')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {flag(c)}{' '}
                {placeLabel({ country: c, region: null, city: null }, locale)}
              </option>
            ))}
          </Select>
          <Select
            className="w-36"
            aria-label={t('الجهاز', 'Appareil')}
            value={device}
            onChange={(e) => {
              setDevice(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('كل الأجهزة', 'Tous appareils')}</option>
            <option value="mobile">{t('هاتف', 'Mobile')}</option>
            <option value="tablet">{t('لوحي', 'Tablette')}</option>
            <option value="desktop">{t('حاسوب', 'Ordinateur')}</option>
          </Select>
        </div>
      </CardHeader>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-5 w-5" />
        </div>
      ) : !data?.items.length ? (
        <p className="py-10 text-center text-xs text-on-surface-variant">
          {t('لا توجد زيارات في هذه الفترة', 'Aucune visite sur la période')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-outline-variant text-xs text-on-surface-variant">
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('الوقت', 'Heure')}
                </th>
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('المكان', 'Lieu')}
                </th>
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('الجهاز', 'Appareil')}
                </th>
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('المصدر', 'Source')}
                </th>
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('صفحة الدخول', 'Entrée')}
                </th>
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('الصفحات', 'Pages')}
                </th>
                <th className="px-4 py-2.5 text-start font-semibold">
                  {t('المدة', 'Durée')}
                </th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => {
                const Icon =
                  DEVICE_ICON[s.device as keyof typeof DEVICE_ICON] ?? Monitor;
                const first = s.pages[0];
                const expanded = open === s.id;
                return (
                  <Fragment key={s.id}>
                    <tr
                      className="cursor-pointer border-b border-outline-variant/60 hover:bg-surface-container/40"
                      onClick={() => setOpen(expanded ? null : s.id)}
                    >
                      <td className="px-4 py-2.5 text-xs" dir="ltr">
                        {time(s.startedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="me-1.5">{flag(s.country)}</span>
                        {placeLabel(s, locale)}
                        {s.isNewVisitor && (
                          <Badge tone="info" className="ms-2">
                            {t('جديد', 'nouveau')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Icon
                          className="h-4 w-4 text-on-surface-variant"
                          aria-label={s.device}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-xs" dir="ltr">
                        {s.referrer ?? t('مباشر', 'direct')}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-2.5 text-xs">
                        {first
                          ? pageLabel(first.path, first.product, locale)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {s.pageViews}
                      </td>
                      <td className="px-4 py-2.5 text-xs" dir="ltr">
                        {duration(s.durationSec)}
                      </td>
                      <td className="px-2 py-2.5">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-on-surface-variant transition-transform',
                            expanded && 'rotate-180',
                          )}
                        />
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-outline-variant/60 bg-surface-low/60">
                        <td colSpan={8} className="px-6 py-3">
                          <ol className="space-y-1 text-xs">
                            {s.pages.map((p, i) => (
                              <li key={`${p.at}-${i}`} className="flex gap-3">
                                <span
                                  className="w-12 shrink-0 text-on-surface-variant"
                                  dir="ltr"
                                >
                                  {time(p.at).slice(11)}
                                </span>
                                <span className="font-medium">
                                  {pageLabel(p.path, p.product, locale)}
                                </span>
                                <span
                                  className="text-on-surface-variant"
                                  dir="ltr"
                                >
                                  {p.path}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </Card>
  );
}

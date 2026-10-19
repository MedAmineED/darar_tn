'use client';

import { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Eye,
  MousePointerClick,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/contexts/locale-context';
import { useTrafficStats } from '@/hooks/use-traffic';
import type { ComparisonMetric, DashboardRange } from '@/lib/api/dashboard';
import type { Granularity, TrafficPoint } from '@/lib/api/traffic';
import { assetUrl, cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { VisitsLog } from '@/components/traffic/visits-log';
import { pageLabel } from '@/components/traffic/page-label';
import { countryName, flag, governorateName } from '@/lib/geo-names';

const GovernorateMap = dynamic(
  () =>
    import('@/components/traffic/governorate-map').then(
      (m) => m.GovernorateMap,
    ),
  {
    ssr: false,
    loading: () => <div className="h-[420px] rounded-lg bg-surface-low" />,
  },
);

const DAY = 86_400_000;
const n = (v: number) => v.toLocaleString('en-US');

function lastDays(days: number): DashboardRange {
  const end = new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
  return {
    from: new Date(Date.parse(`${end}T00:00:00Z`) - (days - 1) * DAY)
      .toISOString()
      .slice(0, 10),
    to: end,
  };
}

function duration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function Change({
  metric,
  inverse,
}: {
  metric: ComparisonMetric;
  inverse?: boolean;
}) {
  if (metric.changePercent === null)
    return <span className="text-[11px] text-on-surface-variant">—</span>;
  const up = metric.changePercent >= 0;
  const good = inverse ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      dir="ltr"
      className={cn(
        'inline-flex items-center text-[11px] font-semibold',
        good ? 'text-tertiary' : 'text-error',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(metric.changePercent)}%
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  metric,
  inverse,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  metric?: ComparisonMetric;
  inverse?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <Icon className="h-4 w-4 text-on-surface-variant" aria-hidden />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p dir="ltr" className="font-heading text-xl font-semibold">
          {value}
        </p>
        {metric && <Change metric={metric} inverse={inverse} />}
      </div>
    </Card>
  );
}

function Bars({
  data,
  label,
}: {
  data: { key: string; label: string; value: number; highlight?: boolean }[];
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <div dir="ltr" role="img" aria-label={label}>
      <div className="flex h-40 items-end gap-[2px]">
        {data.map((d) => (
          <div
            key={d.key}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${d.label}: ${n(d.value)}`}
          >
            <div
              className={cn(
                'w-full rounded-t-sm',
                d.highlight
                  ? 'bg-primary'
                  : 'bg-primary-container/70 group-hover:bg-primary-container',
              )}
              style={{
                height: `${max ? Math.max((d.value / max) * 100, d.value ? 2 : 0) : 0}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-on-surface-variant">
        <span>{data[0]?.label}</span>
        {data.length > 2 && (
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
        )}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function ListBars({
  rows,
  empty,
}: {
  rows: { key: string; label: string; value: number }[];
  empty: string;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length)
    return (
      <p className="py-6 text-center text-xs text-on-surface-variant">
        {empty}
      </p>
    );
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate" dir="ltr">
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums" dir="ltr">
              {n(r.value)} ({total ? Math.round((r.value / total) * 100) : 0}%)
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-container"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-primary-container"
              style={{ width: `${total ? (r.value / total) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function TrafficPage() {
  const { t, locale } = useLocale();
  const [range, setRange] = useState<DashboardRange>(() => lastDays(30));
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [preset, setPreset] = useState<string>('30');
  const [placeTab, setPlaceTab] = useState<'countries' | 'regions' | 'cities'>(
    'regions',
  );
  const { data, isLoading, isFetching, refetch, isError } = useTrafficStats({
    ...range,
    granularity,
  });

  const weekdays =
    locale === 'ar'
      ? [
          'الإثنين',
          'الثلاثاء',
          'الأربعاء',
          'الخميس',
          'الجمعة',
          'السبت',
          'الأحد',
        ]
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const devices: Record<string, string> = {
    mobile: t('هاتف', 'Mobile'),
    tablet: t('لوحي', 'Tablette'),
    desktop: t('حاسوب', 'Ordinateur'),
  };
  const presets = [
    { key: '1', label: t('اليوم', 'Aujourd’hui'), days: 1, g: 'day' as const },
    { key: '7', label: t('7 أيام', '7 jours'), days: 7, g: 'day' as const },
    {
      key: '30',
      label: t('30 يوماً', '30 jours'),
      days: 30,
      g: 'day' as const,
    },
    { key: '90', label: t('3 أشهر', '3 mois'), days: 90, g: 'week' as const },
    { key: '365', label: t('سنة', '1 an'), days: 365, g: 'month' as const },
  ];
  const seriesLabel = (p: TrafficPoint) =>
    granularity === 'month' ? p.date.slice(0, 7) : p.date.slice(5);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {t('زيارات الموقع', 'Trafic du site')}
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t(
              'زوّار المتجر، مجهولو الهوية، حسب توقيت تونس — بدون كوكيز إشهارية.',
              'Visiteurs de la boutique, anonymes, heure de Tunis — sans cookies publicitaires.',
            )}
          </p>
        </div>
        {data && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-tertiary/30 bg-tertiary-container/10 px-3 py-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary" />
            </span>
            {t('متواجدون الآن', 'En ligne maintenant')}:{' '}
            <b dir="ltr">{n(data.live.activeVisitors)}</b>
          </div>
        )}
      </div>

      <Card className="flex flex-wrap items-end gap-2 p-3">
        {presets.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={preset === p.key ? 'primary' : 'secondary'}
            onClick={() => {
              setPreset(p.key);
              setRange(lastDays(p.days));
              setGranularity(p.g);
            }}
          >
            {p.label}
          </Button>
        ))}
        <Input
          type="date"
          dir="ltr"
          className="w-40"
          aria-label={t('من', 'Du')}
          value={range.from}
          onChange={(e) => {
            if (e.target.value) {
              setPreset('');
              setRange((r) => ({ ...r, from: e.target.value }));
            }
          }}
        />
        <Input
          type="date"
          dir="ltr"
          className="w-40"
          aria-label={t('إلى', 'Au')}
          value={range.to}
          onChange={(e) => {
            if (e.target.value) {
              setPreset('');
              setRange((r) => ({ ...r, to: e.target.value }));
            }
          }}
        />
        <div className="flex rounded-lg border border-outline-variant/70 p-0.5">
          {(['day', 'week', 'month'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs',
                granularity === g
                  ? 'bg-primary-container text-primary-on'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              {g === 'day'
                ? t('يومي', 'Jour')
                : g === 'week'
                  ? t('أسبوعي', 'Semaine')
                  : t('شهري', 'Mois')}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          aria-label={t('تحديث', 'Actualiser')}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </Card>

      {isError && (
        <p className="rounded-lg bg-error-container p-3 text-xs text-error-on-container">
          {t(
            'تعذّر تحميل الإحصائيات. تحقّق من الفترة (366 يوماً كحد أقصى).',
            'Chargement impossible. Vérifiez la période (366 jours max).',
          )}
        </p>
      )}

      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={Users}
              label={t('زوّار فريدون', 'Visiteurs uniques')}
              value={n(data.kpis.visitors.value)}
              metric={data.kpis.visitors}
            />
            <Kpi
              icon={Activity}
              label={t('الجلسات (الزيارات)', 'Sessions (visites)')}
              value={n(data.kpis.sessions.value)}
              metric={data.kpis.sessions}
            />
            <Kpi
              icon={Eye}
              label={t('مشاهدات الصفحات', 'Pages vues')}
              value={n(data.kpis.pageViews.value)}
              metric={data.kpis.pageViews}
            />
            <Kpi
              icon={Clock}
              label={t('متوسط مدة الزيارة', 'Durée moyenne de visite')}
              value={duration(data.kpis.avgDurationSec.value)}
              metric={data.kpis.avgDurationSec}
            />
            <Kpi
              icon={Users}
              label={t('زوّار جدد', 'Nouveaux visiteurs')}
              value={n(data.kpis.newVisitors.value)}
              metric={data.kpis.newVisitors}
            />
            <Kpi
              icon={MousePointerClick}
              label={t('صفحات لكل زيارة', 'Pages par visite')}
              value={String(data.kpis.pagesPerSession.value)}
              metric={data.kpis.pagesPerSession}
            />
            <Kpi
              icon={ArrowUpRight}
              label={t('نسبة الارتداد (صفحة واحدة)', 'Taux de rebond (1 page)')}
              value={`${data.kpis.bounceRate.value}%`}
              metric={data.kpis.bounceRate}
              inverse
            />
            <Kpi
              icon={Users}
              label={t('معدّل الزوّار يومياً', 'Visiteurs / jour (moy.)')}
              value={String(data.kpis.avgDailyVisitors)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>
                  {t('الزوّار حسب الولاية', 'Visiteurs par gouvernorat')}
                </CardTitle>
                <p
                  className="mt-0.5 text-[11px] text-on-surface-variant"
                  dir="ltr"
                >
                  {data.range.from} → {data.range.to}
                </p>
              </CardHeader>
              <CardContent>
                <GovernorateMap regions={data.regions} zones={data.cities} />
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  {t(
                    'الموقع تقريبي (حسب عنوان IP، على مستوى المدينة أو الولاية). لا يتم حفظ عنوان IP.',
                    'Localisation approximative (adresse IP, au niveau ville/gouvernorat). L’adresse IP n’est jamais enregistrée.',
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{t('المناطق', 'Zones')}</CardTitle>
                <div className="flex rounded-lg border border-outline-variant/70 p-0.5">
                  {(
                    [
                      ['regions', t('ولايات تونس', 'Gouvernorats')],
                      ['cities', t('المدن', 'Villes')],
                      ['countries', t('الدول', 'Pays')],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlaceTab(key)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs',
                        placeTab === key
                          ? 'bg-primary-container text-primary-on'
                          : 'text-on-surface-variant hover:bg-surface-container',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto">
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={
                    placeTab === 'countries'
                      ? data.countries.map((c) => ({
                          key: c.country ?? 'unknown',
                          label: `${flag(c.country)} ${countryName(c.country, locale) ?? t('غير معروف', 'Inconnu')}`,
                          value: c.sessions,
                        }))
                      : placeTab === 'regions'
                        ? data.regions.map((r) => ({
                            key: r.region ?? 'unknown',
                            label:
                              governorateName(r.region, locale) ??
                              t('ولاية غير معروفة', 'Gouvernorat inconnu'),
                            value: r.sessions,
                          }))
                        : data.cities.map((c) => ({
                            key: `${c.country}-${c.city}`,
                            label: `${flag(c.country)} ${c.city ?? countryName(c.country, locale)}`,
                            value: c.sessions,
                          }))
                  }
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t('المنتجات الأكثر مشاهدة', 'Produits les plus vus')}
              </CardTitle>
            </CardHeader>
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-on-surface-variant">
                {t(
                  'لم يشاهَد أي منتج في هذه الفترة',
                  'Aucun produit vu sur la période',
                )}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-[13px]">
                  <thead>
                    <tr className="border-b border-outline-variant text-xs text-on-surface-variant">
                      <th className="px-4 py-2.5 text-start font-semibold">
                        {t('المنتج', 'Produit')}
                      </th>
                      <th className="px-4 py-2.5 text-start font-semibold">
                        {t('مشاهدات', 'Vues')}
                      </th>
                      <th className="px-4 py-2.5 text-start font-semibold">
                        {t('زوّار', 'Visiteurs')}
                      </th>
                      <th className="px-4 py-2.5 text-start font-semibold">
                        {t('طلبات', 'Commandes')}
                      </th>
                      <th className="px-4 py-2.5 text-start font-semibold">
                        {t('قطع مطلوبة', 'Unités')}
                      </th>
                      <th className="px-4 py-2.5 text-start font-semibold">
                        {t('التحويل', 'Conversion')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p) => {
                      const image = assetUrl(p.image);
                      return (
                        <tr
                          key={p.productId}
                          className="border-b border-outline-variant/60 last:border-0"
                        >
                          <td className="px-4 py-2.5">
                            <a
                              href={`/products/${p.productId}/edit`}
                              className="flex items-center gap-3 hover:text-primary"
                            >
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={image}
                                  alt=""
                                  className="h-9 w-9 rounded object-cover"
                                />
                              ) : (
                                <span className="h-9 w-9 rounded bg-surface-container" />
                              )}
                              <span className="font-medium">
                                {locale === 'ar' ? p.nameAr : p.nameFr}
                              </span>
                            </a>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums" dir="ltr">
                            {n(p.views)}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums" dir="ltr">
                            {n(p.visitors)}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums" dir="ltr">
                            {n(p.orders)}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums" dir="ltr">
                            {n(p.unitsSold)}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums" dir="ltr">
                            {p.conversion}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <CardContent className="text-[11px] text-on-surface-variant">
              {t(
                'التحويل = عدد الطلبات التي فيها المنتج ÷ عدد الزوّار الذين شاهدوه (تقريبي).',
                'Conversion = commandes contenant le produit ÷ visiteurs l’ayant vu (approximatif).',
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                {granularity === 'day'
                  ? t('الزيارات يومياً', 'Visites par jour')
                  : granularity === 'week'
                    ? t('الزيارات أسبوعياً', 'Visites par semaine')
                    : t('الزيارات شهرياً', 'Visites par mois')}
              </CardTitle>
              {data.peak.bucket && (
                <p className="text-xs text-on-surface-variant">
                  {t('أكبر ذروة', 'Pic')}:{' '}
                  <b dir="ltr">{data.peak.bucket.date}</b> (
                  {n(data.peak.bucket.pageViews)} {t('مشاهدة', 'vues')})
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Bars
                label={t('الزيارات عبر الزمن', 'Visites dans le temps')}
                data={data.series.map((p) => ({
                  key: p.date,
                  label: seriesLabel(p),
                  value: p.sessions,
                  highlight: data.peak.bucket?.date === p.date,
                }))}
              />
              <details className="mt-3 text-xs text-on-surface-variant">
                <summary className="w-fit cursor-pointer py-1">
                  {t('عرض الجدول', 'Voir le tableau')}
                </summary>
                <div className="mt-2 max-h-56 overflow-auto rounded border border-outline-variant">
                  <table className="w-full" dir="ltr">
                    <thead className="sticky top-0 bg-surface-low">
                      <tr>
                        <th className="p-2 text-start">
                          {t('الفترة', 'Période')}
                        </th>
                        <th className="p-2 text-start">
                          {t('زوّار', 'Visiteurs')}
                        </th>
                        <th className="p-2 text-start">
                          {t('جلسات', 'Sessions')}
                        </th>
                        <th className="p-2 text-start">
                          {t('مشاهدات', 'Vues')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.series.map((p) => (
                        <tr
                          key={p.date}
                          className="border-t border-outline-variant/50"
                        >
                          <td className="p-2">{p.date}</td>
                          <td className="p-2">{n(p.visitors)}</td>
                          <td className="p-2">{n(p.sessions)}</td>
                          <td className="p-2">{n(p.pageViews)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex items-center justify-between gap-2">
                <CardTitle>{t('ساعات الذروة', 'Heures de pointe')}</CardTitle>
                {data.peak.hour !== null && (
                  <p className="text-xs text-on-surface-variant">
                    {t('الأكثر ازدحاماً', 'La plus chargée')}:{' '}
                    <b dir="ltr">
                      {String(data.peak.hour).padStart(2, '0')}:00–
                      {String((data.peak.hour + 1) % 24).padStart(2, '0')}:00
                    </b>
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <Bars
                  label={t('المشاهدات حسب الساعة', 'Vues par heure')}
                  data={data.hours.map((h) => ({
                    key: String(h.hour),
                    label: `${String(h.hour).padStart(2, '0')}h`,
                    value: h.pageViews,
                    highlight: h.hour === data.peak.hour,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('حسب أيام الأسبوع', 'Par jour de la semaine')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={data.weekdays.map((d) => ({
                    key: String(d.day),
                    label: weekdays[d.day],
                    value: d.pageViews,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('الصفحات الأكثر زيارة', 'Pages les plus vues')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={data.topPages.map((p) => ({
                    key: p.path,
                    label: pageLabel(p.path, p.product, locale),
                    value: p.views,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('مصادر الزيارات', 'Sources de trafic')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={data.referrers.map((r) => ({
                    key: r.source ?? 'direct',
                    label:
                      r.source ?? t('مباشر / غير معروف', 'Direct / inconnu'),
                    value: r.sessions,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('الأجهزة', 'Appareils')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={data.devices.map((d) => ({
                    key: d.device,
                    label: devices[d.device] ?? d.device,
                    value: d.sessions,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('مدة البقاء في الموقع', 'Temps passé sur le site')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={data.durations.map((d) => ({
                    key: d.label,
                    label: d.label,
                    value: d.sessions,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('صفحات الدخول', 'Pages d’entrée')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ListBars
                  empty={t('لا بيانات بعد', 'Pas encore de données')}
                  rows={data.landingPages.map((p) => ({
                    key: p.path,
                    label: pageLabel(p.path, null, locale),
                    value: p.sessions,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('المجموع منذ البداية', 'Total depuis le début')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span>{t('زوّار فريدون', 'Visiteurs uniques')}</span>
                  <b dir="ltr">{n(data.allTime.visitors)}</b>
                </p>
                <p className="flex justify-between">
                  <span>{t('زيارات', 'Visites')}</span>
                  <b dir="ltr">{n(data.allTime.sessions)}</b>
                </p>
                <p className="flex justify-between">
                  <span>{t('مشاهدات', 'Pages vues')}</span>
                  <b dir="ltr">{n(data.allTime.pageViews)}</b>
                </p>
                <p className="flex justify-between text-xs text-on-surface-variant">
                  <span>{t('بداية القياس', 'Mesure depuis')}</span>
                  <span dir="ltr">
                    {data.allTime.since ? data.allTime.since.slice(0, 10) : '—'}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <VisitsLog
            range={range}
            countries={data.countries
              .map((c) => c.country)
              .filter((c): c is string => Boolean(c))}
          />
        </>
      )}
    </div>
  );
}

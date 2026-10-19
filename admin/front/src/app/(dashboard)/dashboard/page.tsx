'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  PackagePlus,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/orders/order-badges';
import { Breakdown, DailyChart } from '@/components/dashboard/analytics-charts';
import { useLocale } from '@/contexts/locale-context';
import { cn, formatPrice } from '@/lib/utils';
import { useDashboardStats } from '@/hooks/use-dashboard';
import type { ComparisonMetric, DashboardRange } from '@/lib/api/dashboard';
import type { OrderStatus, PaymentStatus } from '@/lib/api/commerce-types';
import { useAuth } from '@/providers/auth-provider';

const DAY = 86_400_000;
const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
];
const number = (value: number) => value.toLocaleString('en-US');

function lastDays(days: number): DashboardRange {
  const end = new Date(new Date().getTime() + 3_600_000)
    .toISOString()
    .slice(0, 10);
  return {
    from: new Date(new Date(`${end}T00:00:00Z`).getTime() - (days - 1) * DAY)
      .toISOString()
      .slice(0, 10),
    to: end,
  };
}

function validRange(range: DashboardRange): boolean {
  const start = Date.parse(range.from);
  const end = Date.parse(range.to);
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end >= start &&
    (end - start) / DAY < 366
  );
}

export default function DashboardPage() {
  const { t, locale, strings } = useLocale();
  const { hasPermission } = useAuth();
  const [range, setRange] = useState<DashboardRange>(() => lastDays(30));
  const [draft, setDraft] = useState(range);
  const [filterError, setFilterError] = useState('');
  const { data, isLoading, isError, isFetching, refetch } =
    useDashboardStats(range);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const selected = {
      from: String(fields.get('from') ?? ''),
      to: String(fields.get('to') ?? ''),
    };
    if (!validRange(selected)) {
      setFilterError(
        t(
          'اختر تاريخين بالترتيب، لفترة لا تتجاوز 366 يوماً.',
          'Choisissez une période valide de 366 jours maximum.',
        ),
      );
      return;
    }
    setFilterError('');
    setDraft(selected);
    setRange(selected);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-on-surface">
            {t('لوحة التحليلات', 'Tableau de bord')}
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t(
              'المبيعات والطلبات والعملاء، حسب أيام تونس',
              'Ventes, commandes et clients · fuseau de Tunis',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission('inventory:read') && (
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-lowest px-3 py-2 text-xs text-on-surface hover:bg-surface-container"
            >
              <PackagePlus className="h-4 w-4" />
              {t('إدارة المخزون', 'Gérer le stock')}
            </Link>
          )}
          {hasPermission('order:create') && (
            <Link
              href="/orders/create"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-on hover:bg-primary-container"
            >
              <Plus className="h-4 w-4" />
              {t('طلب جديد', 'Nouvelle commande')}
            </Link>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            title={t('تحديث', 'Actualiser')}
            aria-label={t('تحديث', 'Actualiser')}
          >
            <RefreshCw
              className={cn('h-4 w-4', isFetching && 'animate-spin')}
            />
            <span>{t('تحديث', 'Actualiser')}</span>
          </Button>
        </div>
      </div>

      <section
        aria-label={t('تصفية الفترة', 'Filtrer la période')}
        className="flex flex-wrap items-center justify-between gap-2"
      >
        <div className="inline-flex rounded-lg border border-outline-variant/50 bg-surface-lowest p-1">
          {[7, 30, 90, 365].map((days) => {
            const preset = lastDays(days);
            const selected =
              range.from === preset.from && range.to === preset.to;
            return (
              <button
                key={days}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setDraft(preset);
                  setRange(preset);
                  setFilterError('');
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-primary',
                  selected
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-low',
                )}
              >
                {t(days === 7 ? '7 أيام' : `${days} يومًا`, `${days} j`)}
              </button>
            );
          })}
        </div>
        <form onSubmit={apply} className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 space-y-1 sm:flex-none">
            <span className="block text-[11px] text-on-surface-variant">
              {t('من', 'Du')}
            </span>
            <Input
              id="dashboard-from"
              name="from"
              type="date"
              min="1001-01-01"
              max="9998-12-31"
              required
              dir="ltr"
              value={draft.from}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  from: event.target.value,
                }))
              }
            />
          </label>
          <label className="min-w-0 flex-1 space-y-1 sm:flex-none">
            <span className="block text-[11px] text-on-surface-variant">
              {t('إلى (شامل)', 'Au (inclus)')}
            </span>
            <Input
              id="dashboard-to"
              name="to"
              type="date"
              min="1001-01-01"
              max="9998-12-31"
              required
              dir="ltr"
              value={draft.to}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  to: event.target.value,
                }))
              }
            />
          </label>
          <Button type="submit" size="sm" className="mb-0.5">
            {t('تطبيق', 'Appliquer')}
          </Button>
        </form>
        <p className="w-full text-[11px] leading-5 text-on-surface-variant">
          {t(
            'الفترة حتى 366 يوماً. الإيرادات من الطلبات المدفوعة غير الملغاة، بعد الخصم ومع الشحن، حسب تاريخ إنشاء الطلب.',
            'Jusqu’à 366 jours. Revenus des commandes payées non annulées, après remise et livraison incluse, à la date de création de la commande.',
          )}
        </p>
        {filterError && (
          <p role="alert" className="w-full text-xs text-error">
            {filterError}
          </p>
        )}
      </section>

      {isLoading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 py-24"
        >
          <Spinner className="h-6 w-6" />
          <span className="text-sm">
            {t('جار تحميل التحليلات…', 'Chargement des analyses…')}
          </span>
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container/30 p-8 text-center"
        >
          <p className="mb-3">
            {t(
              'تعذر تحميل التحليلات. أعد المحاولة.',
              'Impossible de charger les analyses. Réessayez.',
            )}
          </p>
          <Button variant="secondary" onClick={() => void refetch()}>
            {t('إعادة المحاولة', 'Réessayer')}
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
            <p>
              {t('الفترة', 'Période')}{' '}
              <bdi dir="ltr">
                {data.range.from} — {data.range.to}
              </bdi>{' '}
              {t('مقارنةً بـ', 'comparée à')}{' '}
              <bdi dir="ltr">
                {data.range.previousFrom} — {data.range.previousTo}
              </bdi>
            </p>
            {isFetching && (
              <span role="status">{t('جار التحديث…', 'Actualisation…')}</span>
            )}
          </div>
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-lowest sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label={t('الإيرادات المدفوعة', 'Revenus payés')}
              metric={data.kpis.revenue}
              money
              highlight
              hint={t(
                `${number(data.kpis.paidOrders)} طلب مدفوع · ${number(data.kpis.unitsSold.value)} وحدة مباعة`,
                `Commandes payées : ${number(data.kpis.paidOrders)} · Unités : ${number(data.kpis.unitsSold.value)}`,
              )}
            />
            <KpiCard
              label={t('الطلبات', 'Commandes')}
              metric={data.kpis.orders}
              hint={t(
                `${number(data.kpis.pendingOrders)} بانتظار التأكيد`,
                `${number(data.kpis.pendingOrders)} en attente de confirmation`,
              )}
            />
            <KpiCard
              label={t('متوسط قيمة الطلب', 'Panier moyen')}
              metric={data.kpis.averageOrderValue}
              money
              hint={t(
                'الإيرادات ÷ الطلبات المدفوعة غير الملغاة',
                'Revenus ÷ commandes payées non annulées',
              )}
            />
            <KpiCard
              label={t('عملاء جدد', 'Nouveaux clients')}
              metric={data.kpis.newCustomers}
              hint={t(
                'بحسب تاريخ إنشاء العميل',
                'À la date de création du client',
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs text-on-surface-variant">
            <p className="font-medium">
              {t('الوحدات المباعة', 'Unités vendues')} :{' '}
              <bdi
                dir="ltr"
                className="ms-1 font-semibold tabular-nums text-on-surface"
              >
                {number(data.kpis.unitsSold.value)}
              </bdi>
            </p>
            <p className="text-xs text-on-surface-variant">
              {t('الفترة السابقة', 'Période précédente')} :{' '}
              <bdi dir="ltr">{number(data.kpis.unitsSold.previousValue)}</bdi>
            </p>
            <p className="text-xs text-on-surface-variant">
              {data.kpis.unitsSold.changePercent === null ? (
                t(
                  'لا تتوفر نسبة تغير: الفترة السابقة صفر',
                  'Variation indisponible : période précédente à zéro',
                )
              ) : (
                <bdi dir="ltr">
                  {data.kpis.unitsSold.changePercent > 0 ? '+' : ''}
                  {number(data.kpis.unitsSold.changePercent)}%
                </bdi>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('الإيرادات اليومية', 'Revenus quotidiens')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyChart
                  data={data.daily}
                  metric="revenue"
                  label={t('الإيرادات المدفوعة', 'Revenus payés')}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('الطلبات اليومية', 'Commandes quotidiennes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyChart
                  data={data.daily}
                  metric="orders"
                  label={t('عدد الطلبات', 'Nombre de commandes')}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('حالات الطلبات', 'Statuts des commandes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Breakdown
                  parameter="status"
                  items={ORDER_STATUSES.map((status) => ({
                    status,
                    label: strings.commerce.orderStatus[status],
                    count: data.ordersByStatus[status],
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('حالات الدفع', 'Statuts des paiements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Breakdown
                  parameter="paymentStatus"
                  items={PAYMENT_STATUSES.map((status) => ({
                    status,
                    label: strings.commerce.paymentStatus[status],
                    count: data.ordersByPaymentStatus[status],
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>
                  {t('المنتجات الأكثر مبيعاً', 'Meilleures ventes')}
                </CardTitle>
                <p className="text-xs text-on-surface-variant">
                  {t(
                    'أعلى 10 حسب الوحدات المدفوعة. قيمة المنتجات قبل خصم الطلب والشحن، والأسماء محفوظة وقت البيع.',
                    'Top 10 par unités payées. Valeur des produits avant remise globale et livraison, noms conservés à la vente.',
                  )}
                </p>
              </CardHeader>
              <CardContent>
                {data.topProducts.length === 0 ? (
                  <EmptyText>
                    {t(
                      'لا توجد مبيعات مدفوعة لهذه الفترة.',
                      'Aucune vente payée sur cette période.',
                    )}
                  </EmptyText>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[440px] text-start text-sm">
                      <caption className="sr-only">
                        {t(
                          'المنتجات الأكثر مبيعاً في الفترة المحددة',
                          'Produits les plus vendus sur la période',
                        )}
                      </caption>
                      <thead className="border-b border-outline-variant text-xs text-on-surface-variant">
                        <tr>
                          <th scope="col" className="pb-3 font-medium">
                            {t('المنتج', 'Produit')}
                          </th>
                          <th scope="col" className="pb-3 font-medium">
                            {t('الوحدات', 'Unités')}
                          </th>
                          <th scope="col" className="pb-3 font-medium">
                            {t('قيمة المنتجات', 'Valeur des produits')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topProducts.map((product) => (
                          <tr
                            key={product.key}
                            className="border-b border-outline-variant/50 last:border-0"
                          >
                            <th scope="row" className="py-3 pe-3 font-normal">
                              <p className="font-medium">
                                {product.productId ? (
                                  <Link
                                    className="rounded text-primary hover:underline focus-visible:outline-primary"
                                    href={`/products/${product.productId}/edit`}
                                  >
                                    {locale === 'fr'
                                      ? product.nameFr
                                      : product.nameAr}
                                  </Link>
                                ) : locale === 'fr' ? (
                                  product.nameFr
                                ) : (
                                  product.nameAr
                                )}
                              </p>
                              <p
                                lang={locale === 'fr' ? 'ar' : 'fr'}
                                dir={locale === 'fr' ? 'rtl' : 'ltr'}
                                className="mt-0.5 text-start text-xs text-on-surface-variant"
                              >
                                {locale === 'fr'
                                  ? product.nameAr
                                  : product.nameFr}
                              </p>
                              {product.sku && (
                                <p
                                  dir="ltr"
                                  className="mt-0.5 text-start text-xs text-on-surface-variant"
                                >
                                  {product.sku}
                                </p>
                              )}
                            </th>
                            <td className="py-3 tabular-nums">
                              {number(product.quantity)}
                            </td>
                            <td className="whitespace-nowrap py-3 tabular-nums">
                              <bdi dir="ltr">
                                {formatPrice(product.grossRevenue)}
                              </bdi>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('تنبيهات المخزون', 'Alertes de stock')}
                </CardTitle>
                <p className="text-xs text-on-surface-variant">
                  {t(
                    'الوضع الحالي لكل المنتجات، مستقل عن فترة التحليلات',
                    'Stock actuel de tous les produits, indépendant de la période',
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/inventory?availability=LOW"
                    className="rounded border border-outline-variant bg-surface-low p-3 hover:border-primary focus-visible:outline-primary"
                  >
                    <span className="block text-xs text-on-surface-variant">
                      {t('مخزون منخفض', 'Stock faible')}
                    </span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums">
                      {number(data.inventory.lowStock)}
                    </span>
                  </Link>
                  <Link
                    href="/inventory?availability=OUT"
                    className="rounded border border-error/25 bg-error-container/25 p-3 hover:border-error focus-visible:outline-primary"
                  >
                    <span className="block text-xs text-on-surface-variant">
                      {t('نفد المخزون', 'Rupture de stock')}
                    </span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums text-error">
                      {number(data.inventory.outOfStock)}
                    </span>
                  </Link>
                </div>
                {data.inventory.alerts.length === 0 ? (
                  <EmptyText>
                    {t(
                      'لا توجد تنبيهات للمنتجات ذات المخزون المسجل.',
                      'Aucune alerte pour les produits suivis en stock.',
                    )}
                  </EmptyText>
                ) : (
                  <ul className="divide-y divide-outline-variant/60">
                    {data.inventory.alerts.map((item) => (
                      <li
                        key={item.productId}
                        className="flex items-start justify-between gap-3 py-3"
                      >
                        <Link
                          href={`/inventory?search=${encodeURIComponent(item.sku || item.nameAr)}`}
                          className="min-w-0 rounded text-sm hover:text-primary focus-visible:outline-primary"
                        >
                          <span className="block truncate">
                            {locale === 'fr' ? item.nameFr : item.nameAr}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {t('حد التنبيه', 'Seuil')} :{' '}
                            {number(item.lowStockThreshold)}
                          </span>
                        </Link>
                        <span
                          className={cn(
                            'shrink-0 text-sm font-semibold tabular-nums',
                            item.quantity === 0 && 'text-error',
                          )}
                        >
                          {number(item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-xs leading-6 text-on-surface-variant">
                  {number(data.inventory.trackedProducts)}{' '}
                  {t('منتج بمخزون مسجل', 'produits suivis')} ·{' '}
                  {number(data.inventory.untrackedProducts)}{' '}
                  {t('دون سجل مخزون', 'sans suivi')} ·{' '}
                  {number(data.kpis.activeProducts)}{' '}
                  {t('منتج نشط', 'produits actifs')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>
                {t('أحدث الطلبات في الفترة', 'Commandes récentes')}
              </CardTitle>
              <Link
                href="/orders"
                className="rounded text-sm text-primary hover:underline focus-visible:outline-primary"
              >
                {t('كل الطلبات', 'Toutes les commandes')}
              </Link>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <EmptyText>
                  {t(
                    'لا توجد طلبات في هذه الفترة.',
                    'Aucune commande sur cette période.',
                  )}
                </EmptyText>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[670px] text-start text-sm">
                    <caption className="sr-only">
                      {t(
                        'أحدث 10 طلبات في الفترة المحددة',
                        'Les 10 dernières commandes de la période',
                      )}
                    </caption>
                    <thead className="border-b border-outline-variant text-xs text-on-surface-variant">
                      <tr>
                        {[
                          t('رقم الطلب', 'N° de commande'),
                          t('العميل', 'Client'),
                          t('التاريخ (تونس)', 'Date (Tunis)'),
                          t('حالة الطلب', 'Statut'),
                          t('الدفع', 'Paiement'),
                          t('المبلغ', 'Montant'),
                        ].map((label) => (
                          <th
                            key={label}
                            scope="col"
                            className="pb-3 font-medium"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-outline-variant/50 last:border-0"
                        >
                          <th scope="row" className="py-3 pe-3 font-medium">
                            <Link
                              href={`/orders/${order.id}`}
                              className="rounded text-primary hover:underline focus-visible:outline-primary"
                            >
                              <bdi dir="ltr">{order.orderNumber}</bdi>
                            </Link>
                          </th>
                          <td className="py-3 pe-3">{order.customerName}</td>
                          <td className="py-3 pe-3 text-on-surface-variant">
                            <bdi dir="ltr">
                              {new Date(
                                new Date(order.createdAt).getTime() + 3_600_000,
                              )
                                .toISOString()
                                .slice(0, 10)}
                            </bdi>
                          </td>
                          <td className="py-3 pe-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="py-3 pe-3">
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </td>
                          <td className="whitespace-nowrap py-3 font-semibold">
                            <bdi dir="ltr">
                              {formatPrice(order.totalAmount)}
                            </bdi>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-on-surface-variant">
      {children}
    </p>
  );
}

function KpiCard({
  label,
  metric,
  money = false,
  hint,
  highlight = false,
}: {
  label: string;
  metric: ComparisonMetric;
  money?: boolean;
  hint: string;
  highlight?: boolean;
}) {
  const { t } = useLocale();
  const format = money ? formatPrice : number;
  const change = metric.changePercent;
  const Direction =
    change !== null && change < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <section
      aria-label={label}
      className={cn(
        'min-w-0 border-b border-outline-variant/40 p-4 last:border-b-0 sm:border-e sm:even:border-e-0 xl:border-b-0 xl:last:border-e-0 xl:even:border-e',
        highlight && 'bg-primary/[0.035]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-on-surface-variant">{label}</p>
        {highlight && <Wallet className="h-3.5 w-3.5 text-primary/70" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        <bdi dir="ltr">{format(metric.value)}</bdi>
      </p>
      <p title={hint} className="mt-1.5 text-[11px] text-on-surface-variant/75">
        {hint}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span
          className={cn(
            'inline-flex items-center gap-1',
            change !== null && change > 0
              ? 'text-tertiary'
              : change !== null && change < 0
                ? 'text-error'
                : 'text-on-surface-variant',
          )}
        >
          {change === null ? (
            t('لا نسبة تغير (السابق 0)', 'Variation indisponible (base 0)')
          ) : (
            <>
              <Direction className="h-3 w-3" aria-hidden />
              <bdi dir="ltr">
                {change > 0 ? '+' : ''}
                {number(change)}%
              </bdi>
            </>
          )}
        </span>
        <span className="text-on-surface-variant/70">
          {t('الفترة السابقة', 'Période précédente')} :{' '}
          <bdi dir="ltr">{format(metric.previousValue)}</bdi>
        </span>
      </div>
    </section>
  );
}

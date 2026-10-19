'use client';

import { useLocale } from '@/contexts/locale-context';
import { useId } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import type { DailyPoint } from '@/lib/api/dashboard';

/** SVG has a fixed coordinate height; its bars do not depend on percentage parent heights. */
export function DailyChart({
  data,
  metric,
  label,
}: {
  data: DailyPoint[];
  metric: 'revenue' | 'orders';
  label: string;
}) {
  const { t } = useLocale();
  const id = useId();
  const maximum = Math.max(...data.map((point) => point[metric]), 0);
  const total = data.reduce((sum, point) => sum + point[metric], 0);
  const format = (value: number) =>
    metric === 'revenue' ? formatPrice(value) : value.toLocaleString('en-US');
  const width = 680;
  const height = 170;
  const barWidth = width / data.length;
  const first = data[0]?.date;
  const last = data[data.length - 1]?.date;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-on-surface-variant">{label}</p>
        <p className="font-heading text-xl font-semibold" dir="ltr">
          {format(total)}
        </p>
      </div>
      {maximum === 0 ? (
        <p className="flex h-48 items-center justify-center rounded-lg bg-surface-low px-4 text-center text-xs text-on-surface-variant">
          {metric === 'revenue'
            ? t(
                'لا توجد إيرادات مدفوعة خلال هذه الفترة',
                'Aucun revenu payé sur cette période',
              )
            : t(
                'لا توجد طلبات خلال هذه الفترة',
                'Aucune commande sur cette période',
              )}
        </p>
      ) : (
        <div dir="ltr">
          <svg
            viewBox="0 0 720 225"
            className="h-48 w-full"
            role="img"
            aria-labelledby={`${id}-title ${id}-description`}
          >
            <title id={`${id}-title`}>{label}</title>
            <desc id={`${id}-description`}>
              {t(
                `من ${first} إلى ${last}. الإجمالي ${format(total)}. البيانات اليومية متاحة في الجدول أدناه.`,
                `Du ${first} au ${last}. Total ${format(total)}. Les données quotidiennes sont disponibles dans le tableau ci-dessous.`,
              )}
            </desc>
            {[0, 0.5, 1].map((ratio) => (
              <g key={ratio}>
                <line
                  x1="30"
                  x2="710"
                  y1={height + 12 - ratio * height}
                  y2={height + 12 - ratio * height}
                  stroke="currentColor"
                  className="text-outline-variant"
                  strokeDasharray="3 4"
                />
                <text
                  x="30"
                  y={height + 9 - ratio * height}
                  fontSize="10"
                  fill="currentColor"
                  className="text-on-surface-variant"
                >
                  {(maximum * ratio).toLocaleString('en-US', {
                    maximumFractionDigits: 1,
                  })}
                </text>
              </g>
            ))}
            {data.map((point, index) => {
              const barHeight = (point[metric] / maximum) * height;
              return (
                <rect
                  key={point.date}
                  x={30 + index * barWidth + barWidth * 0.12}
                  y={height + 12 - barHeight}
                  width={Math.max(barWidth * 0.76, 0.5)}
                  height={barHeight}
                  rx={data.length < 90 ? 2 : 0}
                  fill="currentColor"
                  className={
                    metric === 'revenue'
                      ? 'text-primary-container'
                      : 'text-tertiary-container'
                  }
                >
                  <title>{`${point.date}: ${format(point[metric])}`}</title>
                </rect>
              );
            })}
            <text x="30" y="211" fontSize="11" fill="currentColor">
              {first}
            </text>
            <text
              x="710"
              y="211"
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
            >
              {last}
            </text>
          </svg>
        </div>
      )}
      <details className="mt-3 text-xs text-on-surface-variant">
        <summary className="w-fit cursor-pointer rounded py-1 focus-visible:outline-primary">
          {t('عرض البيانات اليومية', 'Voir les données quotidiennes')}
        </summary>
        <div className="mt-2 max-h-56 overflow-auto rounded border border-outline-variant">
          <table className="w-full text-start">
            <caption className="sr-only">
              {label} {t('حسب التاريخ', 'par date')}
            </caption>
            <thead className="sticky top-0 bg-surface-low">
              <tr>
                <th scope="col" className="p-2">
                  {t('التاريخ', 'Date')}
                </th>
                <th scope="col" className="p-2">
                  {label}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr
                  key={point.date}
                  className="border-t border-outline-variant/50"
                >
                  <th scope="row" className="p-2 font-normal" dir="ltr">
                    {point.date}
                  </th>
                  <td className="p-2" dir="ltr">
                    {format(point[metric])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function Breakdown({
  items,
  parameter,
}: {
  items: { status: string; label: string; count: number }[];
  parameter: 'status' | 'paymentStatus';
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.status}>
          <Link
            href={`/orders?${parameter}=${item.status}`}
            className="mb-1 flex items-center justify-between gap-2 rounded text-xs hover:text-primary focus-visible:outline-primary"
          >
            <span>{item.label}</span>
            <span className="text-xs tabular-nums" dir="ltr">
              {item.count.toLocaleString('en-US')} (
              {total ? Math.round((item.count / total) * 100) : 0}%)
            </span>
          </Link>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-container"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-primary-container"
              style={{ width: `${total ? (item.count / total) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

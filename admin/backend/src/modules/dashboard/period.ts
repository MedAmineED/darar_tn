import { BadRequestException } from '@nestjs/common';

export const DAY_MS = 86_400_000;
const TUNIS_OFFSET_MS = 3_600_000;

export interface ReportingQuery {
  from?: string;
  to?: string;
}

export interface ReportingWindow {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  days: number;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface ComparisonMetric {
  value: number;
  previousValue: number;
  changePercent: number | null;
}

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

const dateLabel = (date: Date): string => date.toISOString().slice(0, 10);

function invalidRange(): never {
  throw new BadRequestException({
    message: 'Use valid from/to dates (YYYY-MM-DD), in order, up to 366 days',
    code: 'INVALID_DASHBOARD_RANGE',
  });
}

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalidRange();
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    dateLabel(date) !== value ||
    date.getUTCFullYear() < 1001 ||
    date.getUTCFullYear() > 9998
  ) {
    return invalidRange();
  }
  return date;
}

/** Inclusive calendar dates in Africa/Tunis (UTC+1), queried as [start,end). */
export function reportingWindow(
  query: ReportingQuery,
  now = new Date(),
): ReportingWindow {
  if ((query.from === undefined) !== (query.to === undefined)) invalidRange();
  const today = parseDate(dateLabel(new Date(now.getTime() + TUNIS_OFFSET_MS)));
  const last = query.to === undefined ? today : parseDate(query.to);
  const first =
    query.from === undefined
      ? new Date(last.getTime() - 29 * DAY_MS)
      : parseDate(query.from);
  const days = (last.getTime() - first.getTime()) / DAY_MS + 1;
  if (days < 1 || days > 366) invalidRange();
  const start = new Date(first.getTime() - TUNIS_OFFSET_MS);
  const end = new Date(last.getTime() + DAY_MS - TUNIS_OFFSET_MS);
  const previousFirst = new Date(first.getTime() - days * DAY_MS);
  return {
    from: dateLabel(first),
    to: dateLabel(last),
    previousFrom: dateLabel(previousFirst),
    previousTo: dateLabel(new Date(first.getTime() - DAY_MS)),
    days,
    start,
    end,
    previousStart: new Date(start.getTime() - days * DAY_MS),
    previousEnd: start,
  };
}

export function comparisonMetric(
  value: number,
  previousValue: number,
): ComparisonMetric {
  return {
    value,
    previousValue,
    changePercent:
      previousValue === 0
        ? null
        : Math.round(((value - previousValue) / previousValue) * 10_000) / 100,
  };
}

/** Only aggregate rows enter JS; output never exceeds the validated 366 days. */
export function dailySeries(
  window: ReportingWindow,
  rows: DailyPoint[],
): DailyPoint[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const first = new Date(`${window.from}T00:00:00.000Z`).getTime();
  return Array.from({ length: window.days }, (_, i) => {
    const date = dateLabel(new Date(first + i * DAY_MS));
    return byDate.get(date) ?? { date, revenue: 0, orders: 0 };
  });
}

import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';
import type { ComparisonMetric, DashboardRange } from './dashboard';

export type Granularity = 'day' | 'week' | 'month';

export interface TrafficPoint {
  date: string;
  sessions: number;
  visitors: number;
  pageViews: number;
}

export interface TrafficStats {
  range: {
    from: string;
    to: string;
    days: number;
    previousFrom: string;
    previousTo: string;
    granularity: Granularity;
    timezone: string;
  };
  kpis: {
    visitors: ComparisonMetric;
    newVisitors: ComparisonMetric;
    sessions: ComparisonMetric;
    pageViews: ComparisonMetric;
    avgDurationSec: ComparisonMetric;
    bounceRate: ComparisonMetric;
    pagesPerSession: ComparisonMetric;
    avgDailyVisitors: number;
  };
  live: { activeVisitors: number };
  allTime: {
    sessions: number;
    visitors: number;
    pageViews: number;
    since: string | null;
  };
  peak: { bucket: TrafficPoint | null; hour: number | null };
  series: TrafficPoint[];
  hours: { hour: number; pageViews: number }[];
  weekdays: { day: number; pageViews: number }[];
  topPages: {
    path: string;
    views: number;
    visitors: number;
    product: ProductRef | null;
  }[];
  topProducts: {
    productId: string;
    slug: string;
    nameAr: string;
    nameFr: string;
    image: string | null;
    views: number;
    visitors: number;
    unitsSold: number;
    orders: number;
    conversion: number;
  }[];
  countries: { country: string | null; sessions: number; visitors: number }[];
  regions: {
    region: string | null;
    sessions: number;
    visitors: number;
    pageViews: number;
  }[];
  cities: {
    country: string;
    region: string | null;
    city: string | null;
    latitude: number;
    longitude: number;
    sessions: number;
    visitors: number;
  }[];
  landingPages: { path: string; sessions: number }[];
  referrers: { source: string | null; sessions: number }[];
  devices: { device: string; sessions: number }[];
  durations: { label: string; sessions: number }[];
}

export interface ProductRef {
  id: string;
  nameAr: string;
  nameFr: string;
}

export interface TrafficSession {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  durationSec: number;
  pageViews: number;
  device: string;
  referrer: string | null;
  isNewVisitor: boolean;
  country: string | null;
  region: string | null;
  city: string | null;
  pages: { path: string; at: string; product: ProductRef | null }[];
}

export interface SessionParams extends DashboardRange {
  page: number;
  limit: number;
  country?: string;
  device?: string;
  path?: string;
}

export async function getTrafficSessions(
  params: SessionParams,
): Promise<Paginated<TrafficSession>> {
  return unwrap(
    await apiClient.get<ApiSuccess<Paginated<TrafficSession>>>(
      '/traffic/sessions',
      { params },
    ),
  );
}

export async function getTrafficStats(
  range: DashboardRange & { granularity: Granularity },
): Promise<TrafficStats> {
  return unwrap(
    await apiClient.get<ApiSuccess<TrafficStats>>('/traffic/stats', {
      params: range,
    }),
  );
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DAY_MS, comparisonMetric, reportingWindow } from '../dashboard/period';
import {
  CollectDto,
  SessionQueryDto,
  TrafficQueryDto,
} from './dto/traffic.dto';
import { cleanHost, cleanPath, deviceOf, isBot } from './device';
import { locate } from './geo';
import { buildPaginatedResult } from '../../common/utils/paginate';

type SqlNumber = Prisma.Decimal | bigint | number | null;
const num = (v: SqlNumber | undefined): number =>
  v === null || v === undefined ? 0 : Number(v);
const round1 = (n: number): number => Math.round(n * 10) / 10;
const LIVE_WINDOW_MS = 5 * 60_000;
// Queued events older than a session's idle limit are clamped.
const MAX_AGE_MS = 30 * 60_000;
const STATS_TTL_MS = 30_000;
const STATS_CACHE_MAX = 100;
// Times are bucketed in Africa/Tunis (UTC+1, no DST).
const local = (column: Prisma.Sql) =>
  Prisma.sql`DATE_ADD(${column}, INTERVAL 1 HOUR)`;

interface TotalsRow {
  sessions: SqlNumber;
  visitors: SqlNumber;
  newVisitors: SqlNumber;
  pageViews: SqlNumber;
  bounces: SqlNumber;
  duration: SqlNumber;
}

@Injectable()
export class TrafficService {
  private readonly statsCache = new Map<
    string,
    {
      value: Awaited<ReturnType<TrafficService['computeStats']>>;
      expires: number;
    }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async collect(
    dto: CollectDto,
    userAgent: string,
    ip?: string,
  ): Promise<void> {
    if (isBot(userAgent)) return;
    const now = Date.now();
    const at = (ago: number) => new Date(now - Math.min(ago, MAX_AGE_MS));
    const views = dto.views
      .map((v) => ({ path: cleanPath(v.path), createdAt: at(v.ago) }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const lastView = views[views.length - 1]?.createdAt.getTime() ?? 0;
    const seenAt = new Date(
      Math.max(lastView, at(dto.activeAgo ?? 0).getTime()),
    );

    const existing = await this.prisma.siteSession.findUnique({
      where: { id: dto.sid },
      select: { visitorId: true, lastSeenAt: true },
    });
    if (existing && existing.visitorId !== dto.vid) return;

    if (!existing) {
      if (!views.length) return;
      const returning = await this.prisma.siteSession.findFirst({
        where: { visitorId: dto.vid },
        select: { id: true },
      });
      try {
        // One write creates the session and all of its queued page views.
        await this.prisma.siteSession.create({
          data: {
            id: dto.sid,
            visitorId: dto.vid,
            landingPath: views[0].path,
            referrer: cleanHost(dto.ref),
            device: deviceOf(userAgent),
            isNewVisitor: !returning,
            ...locate(ip),
            startedAt: views[0].createdAt,
            lastSeenAt: seenAt,
            pageViews: views.length,
            views: { createMany: { data: views } },
          },
        });
        return;
      } catch (error) {
        // A concurrent batch created it first; fall through to an update.
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        )
          throw error;
      }
    }

    const previousSeen = existing?.lastSeenAt.getTime() ?? 0;
    await this.prisma.$transaction([
      this.prisma.siteSession.update({
        where: { id: dto.sid },
        data: {
          pageViews: { increment: views.length },
          ...(seenAt.getTime() > previousSeen ? { lastSeenAt: seenAt } : {}),
        },
      }),
      ...(views.length
        ? [
            this.prisma.pageView.createMany({
              data: views.map((v) => ({ ...v, sessionId: dto.sid })),
            }),
          ]
        : []),
    ]);
  }

  /**
   * Aggregations scan the traffic tables, so identical requests within a short
   * window (auto-refresh, several admins) share one result.
   */
  async stats(query: TrafficQueryDto, now = new Date()) {
    const key = JSON.stringify([query.from, query.to, query.granularity]);
    const hit = this.statsCache.get(key);
    if (hit && hit.expires > now.getTime()) return hit.value;
    const value = await this.computeStats(query, now);
    if (this.statsCache.size >= STATS_CACHE_MAX) this.statsCache.clear();
    this.statsCache.set(key, { value, expires: now.getTime() + STATS_TTL_MS });
    return value;
  }

  private async computeStats(query: TrafficQueryDto, now: Date) {
    const window = reportingWindow(query, now);
    const granularity = query.granularity ?? 'day';
    const inRange = (column: Prisma.Sql) =>
      Prisma.sql`${column} >= ${window.start} AND ${column} < ${window.end}`;
    const bucket =
      granularity === 'month'
        ? Prisma.sql`DATE_FORMAT(${local(Prisma.sql`s.startedAt`)}, '%Y-%m-01')`
        : granularity === 'week'
          ? Prisma.sql`DATE_FORMAT(DATE_SUB(DATE(${local(Prisma.sql`s.startedAt`)}), INTERVAL WEEKDAY(${local(Prisma.sql`s.startedAt`)}) DAY), '%Y-%m-%d')`
          : Prisma.sql`DATE_FORMAT(${local(Prisma.sql`s.startedAt`)}, '%Y-%m-%d')`;

    const [
      current,
      previous,
      allTime,
      live,
      series,
      hours,
      weekdays,
      topPages,
      referrers,
      devices,
      durations,
      landing,
      countries,
      regions,
      cities,
      productViews,
    ] = await Promise.all([
      this.totals(window.start, window.end),
      this.totals(window.previousStart, window.previousEnd),
      this.prisma.$queryRaw<
        {
          sessions: SqlNumber;
          visitors: SqlNumber;
          pageViews: SqlNumber;
          since: Date | null;
        }[]
      >(Prisma.sql`
        SELECT COUNT(*) AS sessions, COUNT(DISTINCT visitorId) AS visitors,
          COALESCE(SUM(pageViews), 0) AS pageViews, MIN(startedAt) AS since
        FROM site_sessions
      `),
      this.prisma.siteSession.count({
        where: {
          lastSeenAt: { gte: new Date(now.getTime() - LIVE_WINDOW_MS) },
        },
      }),
      this.prisma.$queryRaw<
        {
          bucket: string;
          sessions: SqlNumber;
          visitors: SqlNumber;
          pageViews: SqlNumber;
        }[]
      >(Prisma.sql`
        SELECT ${bucket} AS bucket, COUNT(*) AS sessions,
          COUNT(DISTINCT s.visitorId) AS visitors, COALESCE(SUM(s.pageViews), 0) AS pageViews
        FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)}
        GROUP BY bucket ORDER BY bucket ASC
      `),
      this.prisma.$queryRaw<{ hour: SqlNumber; views: SqlNumber }[]>(Prisma.sql`
        SELECT HOUR(${local(Prisma.sql`v.createdAt`)}) AS hour, COUNT(*) AS views
        FROM page_views v WHERE ${inRange(Prisma.sql`v.createdAt`)}
        GROUP BY hour
      `),
      this.prisma.$queryRaw<{ day: SqlNumber; views: SqlNumber }[]>(Prisma.sql`
        SELECT WEEKDAY(${local(Prisma.sql`v.createdAt`)}) AS day, COUNT(*) AS views
        FROM page_views v WHERE ${inRange(Prisma.sql`v.createdAt`)}
        GROUP BY day
      `),
      this.prisma.$queryRaw<
        { path: string; views: SqlNumber; visitors: SqlNumber }[]
      >(Prisma.sql`
        SELECT v.path AS path, COUNT(*) AS views, COUNT(DISTINCT s.visitorId) AS visitors
        FROM page_views v JOIN site_sessions s ON s.id = v.sessionId
        WHERE ${inRange(Prisma.sql`v.createdAt`)}
        GROUP BY v.path ORDER BY views DESC LIMIT 20
      `),
      this.prisma.$queryRaw<
        { source: string | null; sessions: SqlNumber }[]
      >(Prisma.sql`
        SELECT s.referrer AS source, COUNT(*) AS sessions
        FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)}
        GROUP BY s.referrer ORDER BY sessions DESC LIMIT 10
      `),
      this.prisma.$queryRaw<
        { device: string; sessions: SqlNumber }[]
      >(Prisma.sql`
        SELECT s.device AS device, COUNT(*) AS sessions
        FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)}
        GROUP BY s.device ORDER BY sessions DESC
      `),
      this.prisma.$queryRaw<
        { bucket: SqlNumber; sessions: SqlNumber }[]
      >(Prisma.sql`
        SELECT CASE
            WHEN d < 10 THEN 0 WHEN d < 30 THEN 1 WHEN d < 60 THEN 2
            WHEN d < 180 THEN 3 WHEN d < 600 THEN 4 ELSE 5 END AS bucket,
          COUNT(*) AS sessions
        FROM (SELECT TIMESTAMPDIFF(SECOND, s.startedAt, s.lastSeenAt) AS d
              FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)}) t
        GROUP BY bucket
      `),
      this.prisma.$queryRaw<{ path: string; sessions: SqlNumber }[]>(Prisma.sql`
        SELECT s.landingPath AS path, COUNT(*) AS sessions
        FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)}
        GROUP BY s.landingPath ORDER BY sessions DESC LIMIT 10
      `),
      this.prisma.$queryRaw<
        { country: string | null; sessions: SqlNumber; visitors: SqlNumber }[]
      >(Prisma.sql`
        SELECT s.country AS country, COUNT(*) AS sessions, COUNT(DISTINCT s.visitorId) AS visitors
        FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)}
        GROUP BY s.country ORDER BY sessions DESC LIMIT 50
      `),
      this.prisma.$queryRaw<
        {
          region: string | null;
          sessions: SqlNumber;
          visitors: SqlNumber;
          pageViews: SqlNumber;
        }[]
      >(Prisma.sql`
        SELECT s.region AS region, COUNT(*) AS sessions,
          COUNT(DISTINCT s.visitorId) AS visitors, COALESCE(SUM(s.pageViews), 0) AS pageViews
        FROM site_sessions s WHERE ${inRange(Prisma.sql`s.startedAt`)} AND s.country = 'TN'
        GROUP BY s.region ORDER BY visitors DESC
      `),
      this.prisma.$queryRaw<
        {
          country: string;
          region: string | null;
          city: string | null;
          latitude: number;
          longitude: number;
          sessions: SqlNumber;
          visitors: SqlNumber;
        }[]
      >(Prisma.sql`
        SELECT s.country AS country, s.region AS region, s.city AS city,
          ROUND(AVG(s.latitude), 4) AS latitude, ROUND(AVG(s.longitude), 4) AS longitude,
          COUNT(*) AS sessions, COUNT(DISTINCT s.visitorId) AS visitors
        FROM site_sessions s
        WHERE ${inRange(Prisma.sql`s.startedAt`)} AND s.latitude IS NOT NULL
        GROUP BY s.country, s.region, s.city ORDER BY visitors DESC LIMIT 300
      `),
      this.prisma.$queryRaw<
        {
          productId: string;
          slug: string;
          nameAr: string;
          nameFr: string;
          views: SqlNumber;
          visitors: SqlNumber;
        }[]
      >(Prisma.sql`
        SELECT p.id AS productId, p.slug AS slug, p.nameAr AS nameAr, p.nameFr AS nameFr,
          COUNT(*) AS views, COUNT(DISTINCT s.visitorId) AS visitors
        FROM page_views v
        JOIN site_sessions s ON s.id = v.sessionId
        JOIN products p ON v.path = CONCAT('/products/', p.slug)
        WHERE ${inRange(Prisma.sql`v.createdAt`)}
        GROUP BY p.id, p.slug, p.nameAr, p.nameFr ORDER BY views DESC LIMIT 20
      `),
    ]);
    const productIds = productViews.map((p) => p.productId);
    const [sold, images] = productIds.length
      ? await Promise.all([
          this.prisma.$queryRaw<
            { productId: string; units: SqlNumber; orders: SqlNumber }[]
          >(Prisma.sql`
            SELECT oi.productId AS productId, COALESCE(SUM(oi.quantity), 0) AS units,
              COUNT(DISTINCT o.id) AS orders
            FROM order_items oi JOIN orders o ON o.id = oi.orderId
            WHERE o.status <> 'CANCELLED' AND ${inRange(Prisma.sql`o.createdAt`)}
              AND oi.productId IN (${Prisma.join(productIds)})
            GROUP BY oi.productId
          `),
          this.prisma.productImage.findMany({
            where: { productId: { in: productIds } },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            select: { productId: true, url: true },
          }),
        ])
      : [[], []];
    const pageNames = await this.productNamesForPaths(
      topPages.map((p) => p.path),
    );

    const seriesRows = new Map(series.map((r) => [r.bucket, r]));
    const filledSeries = this.buckets(window.from, window.to, granularity).map(
      (date) => {
        const row = seriesRows.get(date);
        return {
          date,
          sessions: num(row?.sessions),
          visitors: num(row?.visitors),
          pageViews: num(row?.pageViews),
        };
      },
    );
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      pageViews: num(hours.find((h) => num(h.hour) === hour)?.views),
    }));
    const weekly = Array.from({ length: 7 }, (_, day) => ({
      day, // 0 = Monday
      pageViews: num(weekdays.find((d) => num(d.day) === day)?.views),
    }));
    const busiest = filledSeries.reduce<(typeof filledSeries)[number] | null>(
      (best, row) => (!best || row.pageViews > best.pageViews ? row : best),
      null,
    );
    const peakHour = hourly.reduce((best, h) =>
      h.pageViews > best.pageViews ? h : best,
    );
    const durationLabels = [
      '<10s',
      '10-30s',
      '30s-1m',
      '1-3m',
      '3-10m',
      '10m+',
    ];

    return {
      range: {
        from: window.from,
        to: window.to,
        days: window.days,
        previousFrom: window.previousFrom,
        previousTo: window.previousTo,
        granularity,
        timezone: 'Africa/Tunis',
      },
      kpis: {
        visitors: comparisonMetric(current.visitors, previous.visitors),
        newVisitors: comparisonMetric(
          current.newVisitors,
          previous.newVisitors,
        ),
        sessions: comparisonMetric(current.sessions, previous.sessions),
        pageViews: comparisonMetric(current.pageViews, previous.pageViews),
        avgDurationSec: comparisonMetric(
          current.avgDurationSec,
          previous.avgDurationSec,
        ),
        bounceRate: comparisonMetric(current.bounceRate, previous.bounceRate),
        pagesPerSession: comparisonMetric(
          current.pagesPerSession,
          previous.pagesPerSession,
        ),
        avgDailyVisitors: round1(current.visitors / window.days),
      },
      live: { activeVisitors: live },
      allTime: {
        sessions: num(allTime[0]?.sessions),
        visitors: num(allTime[0]?.visitors),
        pageViews: num(allTime[0]?.pageViews),
        since: allTime[0]?.since ?? null,
      },
      peak: {
        bucket: busiest && busiest.pageViews > 0 ? busiest : null,
        hour: peakHour.pageViews > 0 ? peakHour.hour : null,
      },
      series: filledSeries,
      hours: hourly,
      weekdays: weekly,
      topPages: topPages.map((r) => ({
        path: r.path,
        views: num(r.views),
        visitors: num(r.visitors),
        product: pageNames.get(r.path) ?? null,
      })),
      topProducts: productViews.map((r) => {
        const sale = sold.find((x) => x.productId === r.productId);
        const views = num(r.views);
        const orders = num(sale?.orders);
        return {
          productId: r.productId,
          slug: r.slug,
          nameAr: r.nameAr,
          nameFr: r.nameFr,
          image: images.find((i) => i.productId === r.productId)?.url ?? null,
          views,
          visitors: num(r.visitors),
          unitsSold: num(sale?.units),
          orders,
          conversion: num(r.visitors)
            ? round1((orders / num(r.visitors)) * 100)
            : 0,
        };
      }),
      countries: countries.map((r) => ({
        country: r.country,
        sessions: num(r.sessions),
        visitors: num(r.visitors),
      })),
      regions: regions.map((r) => ({
        region: r.region,
        sessions: num(r.sessions),
        visitors: num(r.visitors),
        pageViews: num(r.pageViews),
      })),
      cities: cities.map((r) => ({
        country: r.country,
        region: r.region,
        city: r.city,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        sessions: num(r.sessions),
        visitors: num(r.visitors),
      })),
      landingPages: landing.map((r) => ({
        path: r.path,
        sessions: num(r.sessions),
      })),
      referrers: referrers.map((r) => ({
        source: r.source,
        sessions: num(r.sessions),
      })),
      devices: devices.map((r) => ({
        device: r.device,
        sessions: num(r.sessions),
      })),
      durations: durationLabels.map((label, i) => ({
        label,
        sessions: num(durations.find((d) => num(d.bucket) === i)?.sessions),
      })),
    };
  }

  /** Recent visits with their page journey, newest first. */
  async sessions(query: SessionQueryDto) {
    const window = reportingWindow({ from: query.from, to: query.to });
    const where: Prisma.SiteSessionWhereInput = {
      startedAt: { gte: window.start, lt: window.end },
      country: query.country,
      device: query.device,
      ...(query.path ? { views: { some: { path: query.path } } } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.siteSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: {
          views: {
            orderBy: { createdAt: 'asc' },
            take: 50,
            select: { path: true, createdAt: true },
          },
        },
      }),
      this.prisma.siteSession.count({ where }),
    ]);
    const names = await this.productNamesForPaths(
      rows.flatMap((r) => r.views.map((v) => v.path)),
    );
    return buildPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        startedAt: r.startedAt,
        lastSeenAt: r.lastSeenAt,
        durationSec: Math.max(
          0,
          Math.round((r.lastSeenAt.getTime() - r.startedAt.getTime()) / 1000),
        ),
        pageViews: r.pageViews,
        device: r.device,
        referrer: r.referrer,
        isNewVisitor: r.isNewVisitor,
        country: r.country,
        region: r.region,
        city: r.city,
        pages: r.views.map((v) => ({
          path: v.path,
          at: v.createdAt,
          product: names.get(v.path) ?? null,
        })),
      })),
      total,
      query.page,
      query.limit,
    );
  }

  /** Maps "/products/<slug>" paths to product names for readable reports. */
  private async productNamesForPaths(paths: string[]) {
    const slugs = [
      ...new Set(
        paths
          .filter((p) => p.startsWith('/products/'))
          .map((p) => p.slice('/products/'.length)),
      ),
    ];
    const products = slugs.length
      ? await this.prisma.product.findMany({
          where: { slug: { in: slugs } },
          select: { id: true, slug: true, nameAr: true, nameFr: true },
        })
      : [];
    return new Map(
      products.map((p) => [
        `/products/${p.slug}`,
        { id: p.id, nameAr: p.nameAr, nameFr: p.nameFr },
      ]),
    );
  }

  private async totals(start: Date, end: Date) {
    const [row] = await this.prisma.$queryRaw<TotalsRow[]>(Prisma.sql`
      SELECT COUNT(*) AS sessions, COUNT(DISTINCT visitorId) AS visitors,
        COUNT(DISTINCT CASE WHEN isNewVisitor THEN visitorId END) AS newVisitors,
        COALESCE(SUM(pageViews), 0) AS pageViews,
        COALESCE(SUM(CASE WHEN pageViews <= 1 THEN 1 ELSE 0 END), 0) AS bounces,
        COALESCE(AVG(TIMESTAMPDIFF(SECOND, startedAt, lastSeenAt)), 0) AS duration
      FROM site_sessions WHERE startedAt >= ${start} AND startedAt < ${end}
    `);
    const sessions = num(row?.sessions);
    return {
      sessions,
      visitors: num(row?.visitors),
      newVisitors: num(row?.newVisitors),
      pageViews: num(row?.pageViews),
      avgDurationSec: Math.round(num(row?.duration)),
      bounceRate: sessions ? round1((num(row?.bounces) / sessions) * 100) : 0,
      pagesPerSession: sessions ? round1(num(row?.pageViews) / sessions) : 0,
    };
  }

  /** Every bucket label in range, so charts show empty periods as zero. */
  private buckets(
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month',
  ): string[] {
    const out: string[] = [];
    const first = new Date(`${from}T00:00:00.000Z`);
    const last = new Date(`${to}T00:00:00.000Z`);
    let cursor = new Date(first);
    if (granularity === 'week')
      cursor = new Date(
        first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY_MS,
      );
    if (granularity === 'month')
      cursor = new Date(
        Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
      );
    while (cursor <= last) {
      out.push(cursor.toISOString().slice(0, 10));
      cursor =
        granularity === 'month'
          ? new Date(
              Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
            )
          : new Date(
              cursor.getTime() + (granularity === 'week' ? 7 : 1) * DAY_MS,
            );
    }
    return out;
  }
}

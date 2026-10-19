'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type {
  GeoJSON as GeoJSONLayer,
  LayerGroup,
  Map as LeafletMap,
} from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { useLocale } from '@/contexts/locale-context';
import { governorateName } from '@/lib/geo-names';
import type { TrafficStats } from '@/lib/api/traffic';
import { cn } from '@/lib/utils';

type Metric = 'visitors' | 'sessions' | 'pageViews';
type GovFeature = Feature<Geometry, { code: string }>;

// Wood palette, light → dark; index 0 is "no visits".
const SCALE = [
  '#f6f1ee',
  '#ead8c9',
  '#d4b08f',
  '#b5835c',
  '#8b5e3c',
  '#5d4037',
];

let boundaries: Promise<FeatureCollection<Geometry, { code: string }>> | null =
  null;
function loadBoundaries() {
  boundaries ??= fetch('/geo/tn-governorates.json').then((r) => {
    if (!r.ok) throw new Error('boundaries');
    return r.json() as Promise<FeatureCollection<Geometry, { code: string }>>;
  });
  return boundaries;
}

function step(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(5, Math.max(1, Math.ceil((value / max) * 5)));
}

const n = (v: number) => v.toLocaleString('en-US');

/**
 * Choropleth of Tunisia's 24 governorates for the selected period: each
 * governorate is shaded and labelled by its visitors (or visits / page views).
 * Zones (cities) can be overlaid. Approximate IP-based location.
 */
export function GovernorateMap({
  regions,
  zones,
}: {
  regions: TrafficStats['regions'];
  zones: TrafficStats['cities'];
}) {
  const { t, locale } = useLocale();
  const [metric, setMetric] = useState<Metric>('visitors');
  const [showZones, setShowZones] = useState(false);
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const shapes = useRef<GeoJSONLayer | null>(null);
  const zoneLayer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import('leaflet') | null>(null);
  const [ready, setReady] = useState(false);

  const byCode = useMemo(
    () =>
      new Map(
        regions.filter((r) => r.region).map((r) => [r.region as string, r]),
      ),
    [regions],
  );
  const max = Math.max(
    ...regions.filter((r) => r.region).map((r) => r[metric]),
    0,
  );
  const unknown = regions.find((r) => !r.region);
  const tnZones = zones.filter((z) => z.country === 'TN');

  useEffect(() => {
    let cancelled = false;
    Promise.all([import('leaflet'), loadBoundaries()])
      .then(([L, geo]) => {
        if (cancelled || !container.current || map.current) return;
        leaflet.current = L;
        map.current = L.map(container.current, {
          zoomSnap: 0.25,
          scrollWheelZoom: false,
          attributionControl: true,
          maxBounds: [
            [29, 6],
            [38.5, 12.5],
          ],
          minZoom: 5.5,
        });
        map.current.attributionControl.setPrefix(false);
        map.current.attributionControl.addAttribution(
          'geoBoundaries · OSM (ODbL)',
        );
        shapes.current = L.geoJSON(geo, { style: { weight: 1 } }).addTo(
          map.current,
        );
        map.current.fitBounds(shapes.current.getBounds(), { padding: [8, 8] });
        zoneLayer.current = L.layerGroup();
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Restyle and relabel whenever the data, metric or language changes.
  useEffect(() => {
    if (!ready || !shapes.current) return;
    shapes.current.eachLayer((layer) => {
      const feature = (layer as unknown as { feature: GovFeature }).feature;
      const path = layer as unknown as import('leaflet').Path;
      const code = feature.properties.code;
      const row = byCode.get(code);
      const value = row?.[metric] ?? 0;
      const name = governorateName(code, locale) ?? code;
      path.setStyle({
        fillColor: SCALE[step(value, max)],
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: 1,
      });
      const top = tnZones
        .filter((z) => z.region === code && z.city)
        .slice(0, 3)
        .map((z) => `${escapeHtml(z.city as string)} (${n(z.visitors)})`)
        .join(' · ');
      path.unbindTooltip();
      path.bindTooltip(
        `<b>${escapeHtml(name)}</b><br>` +
          `${n(row?.visitors ?? 0)} ${t('زائر', 'visiteurs')} · ${n(row?.sessions ?? 0)} ${t('زيارة', 'visites')} · ${n(row?.pageViews ?? 0)} ${t('مشاهدة', 'vues')}` +
          (top
            ? `<br><span style="opacity:.75">${t('المناطق', 'Zones')}: ${top}</span>`
            : ''),
        { sticky: true, direction: 'top' },
      );
      path.off('mouseover mouseout');
      path.on('mouseover', () =>
        path.setStyle({ weight: 2.5, color: '#3e2723' }),
      );
      path.on('mouseout', () => path.setStyle({ weight: 1, color: '#ffffff' }));
      // Permanent count label on governorates that had traffic.
      const labelled = layer as unknown as {
        _countLabel?: import('leaflet').Tooltip;
      };
      labelled._countLabel?.remove();
      labelled._countLabel = undefined;
      if (value > 0 && leaflet.current && map.current) {
        const center = (layer as unknown as import('leaflet').Polygon)
          .getBounds()
          .getCenter();
        labelled._countLabel = leaflet.current
          .tooltip({
            permanent: true,
            direction: 'center',
            className: 'gov-count',
            interactive: false,
          })
          .setLatLng(center)
          .setContent(`${n(value)}`)
          .addTo(map.current);
      }
    });
  }, [ready, byCode, metric, max, locale, t, tnZones]);

  // Optional zone (city) dots.
  useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L || !map.current || !zoneLayer.current) return;
    zoneLayer.current.clearLayers();
    const zmax = Math.max(...tnZones.map((z) => z.visitors), 1);
    for (const z of tnZones) {
      L.circleMarker([z.latitude, z.longitude], {
        radius: 3 + Math.sqrt(z.visitors / zmax) * 9,
        color: '#3e2723',
        weight: 1,
        fillColor: '#6b8e23',
        fillOpacity: 0.85,
      })
        .bindTooltip(
          `<b>${escapeHtml(z.city ?? t('منطقة غير معروفة', 'Zone inconnue'))}</b><br>${n(z.visitors)} ${t('زائر', 'visiteurs')} · ${n(z.sessions)} ${t('زيارة', 'visites')}`,
        )
        .addTo(zoneLayer.current);
    }
    if (showZones) zoneLayer.current.addTo(map.current);
    else zoneLayer.current.remove();
  }, [ready, tnZones, showZones, t]);

  const metrics: [Metric, string][] = [
    ['visitors', t('الزوّار', 'Visiteurs')],
    ['sessions', t('الزيارات', 'Visites')],
    ['pageViews', t('المشاهدات', 'Pages vues')],
  ];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border border-outline-variant/70 p-0.5">
          {metrics.map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs',
                metric === key
                  ? 'bg-primary-container text-primary-on'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              {text}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-on-surface-variant">
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
          />
          {t('إظهار المناطق (المدن)', 'Afficher les zones (villes)')}
        </label>
      </div>
      <div className="relative">
        <div
          ref={container}
          dir="ltr"
          className="z-0 h-[420px] w-full overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-low"
          role="img"
          aria-label={t(
            'خريطة الزوّار حسب الولاية',
            'Carte des visiteurs par gouvernorat',
          )}
        />
        {failed && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-error">
            {t(
              'تعذّر تحميل حدود الولايات',
              'Impossible de charger les gouvernorats',
            )}
          </p>
        )}
        <div
          className="pointer-events-none absolute bottom-2 start-2 z-[500] rounded bg-surface-lowest/90 px-2 py-1.5 text-[10px] text-on-surface-variant shadow-sm"
          dir="ltr"
        >
          <div className="flex items-center gap-0.5">
            {SCALE.map((c, i) => (
              <span
                key={c}
                className="h-2.5 w-5"
                style={{ background: c }}
                title={String(i)}
              />
            ))}
          </div>
          <div className="mt-0.5 flex justify-between">
            <span>0</span>
            <span>{n(max)}</span>
          </div>
        </div>
      </div>
      {unknown && unknown[metric] > 0 && (
        <p className="mt-1.5 text-[11px] text-on-surface-variant">
          {t(
            `${n(unknown[metric])} من تونس بولاية غير محدّدة.`,
            `${n(unknown[metric])} depuis la Tunisie sans gouvernorat identifié.`,
          )}
        </p>
      )}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] ?? c,
  );
}

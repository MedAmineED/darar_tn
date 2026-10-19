import { isIP } from 'node:net';

export interface GeoPoint {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface GeoLookup {
  lookup(ip: string): {
    country: string;
    region: string;
    city: string;
    ll: [number, number];
  } | null;
}

const EMPTY: GeoPoint = {
  country: null,
  region: null,
  city: null,
  latitude: null,
  longitude: null,
};

let db: GeoLookup | null = null;

/**
 * Approximate location from an IP using the offline GeoLite2 data bundled with
 * geoip-lite (no network call, IP never leaves the server or gets stored).
 * The ~150 MB database is loaded lazily on the first lookup.
 */
export function locate(ip: string | undefined): GeoPoint {
  const address = ip?.replace(/^::ffff:/, '').trim();
  if (!address || !isIP(address)) return EMPTY;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  db ??= require('geoip-lite') as GeoLookup;
  const hit = db.lookup(address);
  if (!hit || !hit.country) return EMPTY;
  return {
    country: hit.country.slice(0, 2),
    region: hit.region ? hit.region.slice(0, 10) : null,
    city: hit.city ? hit.city.slice(0, 120) : null,
    latitude: Number.isFinite(hit.ll?.[0]) ? hit.ll[0] : null,
    longitude: Number.isFinite(hit.ll?.[1]) ? hit.ll[1] : null,
  };
}

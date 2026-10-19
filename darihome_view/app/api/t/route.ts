import { NextResponse, type NextRequest } from 'next/server';

/**
 * Same-origin relay for the anonymous traffic beacon. The browser never talks
 * to the API host directly; this forwards the event server-side with the
 * visitor's user agent (device/bot detection) and IP (approximate location
 * lookup only — the backend never stores the IP).
 */
const API_BASE_URL = (
  process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

// Light per-IP guard so one client cannot flood the relay.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function limited(key: string): boolean {
  const now = Date.now();
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local';
  if (limited(ip)) return new NextResponse(null, { status: 204 });

  let body: string;
  try {
    body = await request.text();
    if (body.length > 16_000) return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  try {
    await fetch(`${API_BASE_URL}/traffic/collect`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': request.headers.get('user-agent') ?? '',
        ...(ip !== 'local' ? { 'x-visitor-ip': ip } : {}),
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    /* Analytics must never affect the visitor. */
  }
  return new NextResponse(null, { status: 204 });
}

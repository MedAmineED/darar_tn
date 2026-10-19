'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'darar_vid';
const SESSION_KEY = 'darar_sid';
const SESSION_IDLE_MS = 30 * 60_000;
/** Queued page views are sent this long after the first one… */
const FLUSH_DELAY_MS = 15_000;
/** …or immediately once this many are waiting. */
const MAX_QUEUE = 10;
/** Engaged readers on one page refresh their "last seen" at most this often. */
const HEARTBEAT_MS = 3 * 60_000;

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Anonymous ids only: a random visitor id and a 30-minute-idle session id. */
function ids(): { vid: string; sid: string } | null {
  try {
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = randomId();
      localStorage.setItem(VISITOR_KEY, vid);
    }
    const now = Date.now();
    const raw = localStorage.getItem(SESSION_KEY);
    const stored = raw ? (JSON.parse(raw) as { id?: string; at?: number }) : {};
    const sid =
      stored.id && stored.at && now - stored.at < SESSION_IDLE_MS
        ? stored.id
        : randomId();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: sid, at: now }));
    return { vid, sid };
  } catch {
    return null;
  }
}

function externalReferrer(): string | undefined {
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    return referrer && referrer.host !== location.host
      ? referrer.host
      : undefined;
  } catch {
    return undefined;
  }
}

// Module state: one queue per tab, shared across client-side navigations.
const queue: { path: string; at: number }[] = [];
let lastActive = Date.now();
let lastSent = 0;
let timer: number | undefined;
const referrer =
  typeof document === 'undefined' ? undefined : externalReferrer();

/**
 * Sends everything queued in ONE request. With nothing queued it only reports
 * that the visitor was still active (for visit duration), and only if they
 * actually did something since the last send.
 */
function flush(): void {
  window.clearTimeout(timer);
  timer = undefined;
  if (!queue.length && lastActive <= lastSent) return;
  const current = ids();
  if (!current) return;
  const now = Date.now();
  const body = JSON.stringify({
    ...current,
    ...(referrer ? { ref: referrer } : {}),
    views: queue.splice(0).map((v) => ({ path: v.path, ago: now - v.at })),
    activeAgo: Math.max(0, now - lastActive),
  });
  lastSent = now;
  try {
    if (
      navigator.sendBeacon?.(
        '/api/t',
        new Blob([body], { type: 'application/json' }),
      )
    )
      return;
  } catch {
    /* fall back to fetch */
  }
  fetch('/api/t', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  }).catch(() => undefined);
}

function schedule(): void {
  if (queue.length >= MAX_QUEUE) return flush();
  timer ??= window.setTimeout(flush, FLUSH_DELAY_MS);
}

/**
 * Privacy-friendly, low-traffic analytics: page views are batched in the
 * browser and sent together — typically one or two requests per visit
 * instead of one per click — plus a final beacon when the tab is hidden.
 */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (navigator.webdriver) return;
    queue.push({ path: pathname, at: Date.now() });
    lastActive = Date.now();
    schedule();
  }, [pathname]);

  useEffect(() => {
    if (navigator.webdriver) return;
    // Activity only updates a timestamp — it never sends anything by itself.
    const markActive = () => {
      lastActive = Date.now();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible' && lastActive > lastSent)
        flush();
    }, HEARTBEAT_MS);
    const events = ['pointerdown', 'keydown', 'scroll'] as const;
    events.forEach((e) =>
      window.addEventListener(e, markActive, { passive: true }),
    );
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(heartbeat);
      events.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return null;
}

const BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|curl|wget|python|axios|node-fetch|monitor/i;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function deviceOf(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return 'tablet';
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

/** Keeps only a clean path: no query string, no fragment, bounded length. */
export function cleanPath(path: string | undefined): string {
  const value = (path ?? '/').split(/[?#]/)[0] || '/';
  return value.startsWith('/') ? value.slice(0, 500) : '/';
}

export function cleanHost(ref: string | undefined): string | null {
  if (!ref) return null;
  const host = ref
    .replace(/^https?:\/\//i, '')
    .split(/[/?#:]/)[0]
    .toLowerCase()
    .replace(/^www\./, '');
  return /^[a-z0-9.-]{1,255}$/.test(host) ? host : null;
}

/**
 * Resolves API-relative media paths (e.g. "/uploads/products/x.jpg") to
 * absolute URLs pointing at the backend media host. Server-side only value —
 * the host is not a secret, but we keep it out of NEXT_PUBLIC to avoid leaking
 * backend topology into the client bundle unnecessarily.
 */
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';
const MEDIA_BASE = (
  process.env.MEDIA_BASE_URL ?? API_BASE.replace(/\/api\/v1\/?$/, '')
).replace(/\/+$/, '');

export function resolveMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${MEDIA_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

import 'server-only';
import type { ApiEnvelope } from './types';

/**
 * Tiny, typed API client for the storefront. Centralizes base URL, timeouts,
 * envelope handling and error normalization so components never touch fetch.
 * Server-only: importing this into a Client Component is a build error.
 */

const API_BASE_URL = (
  process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 8_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | undefined | null;

export interface ApiGetOptions {
  searchParams?: Record<string, QueryValue>;
  /** ISR revalidation window in seconds. */
  revalidate?: number;
  tags?: string[];
  timeoutMs?: number;
}

function buildUrl(
  path: string,
  searchParams?: Record<string, QueryValue>,
): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiGet<T>(
  path: string,
  options: ApiGetOptions = {},
): Promise<T> {
  const { searchParams, revalidate, tags, timeoutMs = DEFAULT_TIMEOUT_MS } =
    options;
  const url = buildUrl(path, searchParams);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Fresh by default (no-store) so admin edits — deleting a category, adding a
  // product, price changes — show on the storefront immediately. Pass an
  // explicit `revalidate` only where some staleness is acceptable.
  const cacheOptions =
    revalidate === undefined
      ? { cache: 'no-store' as const }
      : { next: { revalidate, tags } };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
      ...cacheOptions,
    });
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(
      aborted ? 'Upstream API timed out' : 'Failed to reach the API',
      aborted ? 504 : 502,
    );
  }
  clearTimeout(timeout);

  let body: ApiEnvelope<T> | undefined;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = undefined;
  }

  if (!response.ok || !body || body.success !== true) {
    const message =
      body && body.success === false ? body.message : 'Unexpected API response';
    const code = body && body.success === false ? body.error?.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return body.data;
}

export async function apiPost<T>(
  path: string,
  payload: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(
      aborted ? 'Upstream API timed out' : 'Failed to reach the API',
      aborted ? 504 : 502,
    );
  }
  clearTimeout(timeout);

  let body: ApiEnvelope<T> | undefined;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = undefined;
  }

  if (!response.ok || !body || body.success !== true) {
    const message =
      body && body.success === false ? body.message : 'Unexpected API response';
    const code = body && body.success === false ? body.error?.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return body.data;
}

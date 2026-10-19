import { getCurrentLocale } from '@/lib/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Resolves a stored relative asset path (e.g. "/uploads/..") to an absolute URL. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  try {
    return `${new URL(API_URL).origin}${path}`;
  } catch {
    return path;
  }
}

/** Formats a price in Tunisian Dinar with Western numerals. */
export function formatPrice(
  value: number,
  locale = getCurrentLocale(),
): string {
  return `${value.toLocaleString(locale === 'fr' ? 'fr-TN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${locale === 'ar' ? 'د.ت' : 'TND'}`;
}

/** Formats an ISO date as YYYY-MM-DD (Western numerals, LTR-safe). */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

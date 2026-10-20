/**
 * Meta Pixel helpers. The base snippet is rendered in the root layout's
 * <head>, so `window.fbq` (or its queueing stub) exists before hydration and
 * events fired from effects are never lost. With no pixel id configured every
 * call is a no-op.
 */
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
export const PIXEL_CURRENCY = 'TND';

export interface PixelLine {
  slug: string;
  price: number;
  qty: number;
}

/** Standard e-commerce params from cart lines. */
export function contentsOf(lines: PixelLine[]) {
  return {
    content_type: 'product',
    content_ids: lines.map((l) => l.slug),
    contents: lines.map((l) => ({
      id: l.slug,
      quantity: l.qty,
      item_price: l.price,
    })),
    num_items: lines.reduce((n, l) => n + l.qty, 0),
    currency: PIXEL_CURRENCY,
  };
}

/**
 * Fires a standard event. `eventId` lets a later server-side (Conversions API)
 * copy of the same event be deduplicated against this browser one.
 */
export function track(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (!PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
  try {
    if (eventId) window.fbq('track', event, params, { eventID: eventId });
    else window.fbq('track', event, params);
  } catch {
    /* Tracking must never affect the visitor. */
  }
}

/** Inline base code: loads fbevents.js, inits the pixel, sends the first PageView. */
export function pixelSnippet(id: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(id)});fbq('track','PageView');`;
}

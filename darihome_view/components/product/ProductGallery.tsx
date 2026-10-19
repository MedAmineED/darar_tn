'use client';

import { useState, type MouseEvent } from 'react';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { StorefrontImage } from '@/lib/api/types';
import { clsx } from '@/lib/clsx';

/**
 * Product image gallery — thumbnails + click-to-zoom, ported from initGallery()
 * in the template's main.js.
 */
export function ProductGallery({
  images,
  name,
  locale,
}: {
  images: StorefrontImage[];
  name: string;
  locale: Locale;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const current = images[active];

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!current) {
    return (
      <div className="rounded-lg overflow-hidden aspect-square bg-surface-low grid place-items-center text-outline" />
    );
  }

  return (
    <div className="reveal">
      <div
        className={clsx('zoomable rounded-lg overflow-hidden aspect-square bg-surface-low relative', zoomed && 'zoomed')}
        onClick={() => setZoomed((z) => !z)}
        onMouseMove={onMove}
        onMouseLeave={() => setZoomed(false)}
      >
        <Image
          src={current.url}
          alt={localize(locale, current.altAr, current.altFr) || name}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
          style={{ transformOrigin: origin }}
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => {
                setActive(i);
                setZoomed(false);
              }}
              className={clsx(
                'thumb rounded overflow-hidden aspect-square bg-surface-low relative',
                i === active && 'is-active',
              )}
              aria-label={`${name} — ${i + 1}`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

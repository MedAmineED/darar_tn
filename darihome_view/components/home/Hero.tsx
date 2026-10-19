'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '@/components/ui/Icon';

/**
 * Full-bleed hero: the photograph fills the section edge to edge at full
 * saturation, and the copy sits on a translucent card of the brand brown.
 *
 * Legibility is a property of the card, not of the picture — white type on
 * an 80%-opaque brown panel holds the same contrast ratio wherever the card
 * lands, so the image never has to be washed out to make the words readable.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const layer = useRef<HTMLDivElement>(null);

  // Subtle parallax on the hero media — ported from initParallax().
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (layer.current) {
          layer.current.style.transform = `translate3d(0, ${Math.min(y * 0.14, 120)}px, 0)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="hero-full">
      <div ref={layer} className="hero-media absolute inset-0 -z-10">
        <Image
          src="/assets/images/daria-gero.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* Painted over the photo but under the copy. Outside the parallax
          wrapper so it cannot drift away from the header as the page moves. */}
      <div aria-hidden className="hero-topfade -z-10" />

      <div className="max-w-container mx-auto px-5 md:px-16 w-full">
        <div className="hero-card">
          <p
            className="hero-fade text-xs font-semibold uppercase tracking-widest text-[#eddcc2] mb-4"
            style={{ '--fade-delay': '120ms' } as CSSProperties}
          >
            {dict.hero.eyebrow}
          </p>
          <h1 className="font-display font-bold text-white leading-[1.08] text-[2rem] sm:text-4xl lg:text-5xl">
            <span className="block overflow-hidden">
              <span className="hero-word" style={{ '--word-delay': '150ms' } as CSSProperties}>
                {dict.hero.title1}
              </span>{' '}
              <span className="hero-word" style={{ '--word-delay': '260ms' } as CSSProperties}>
                {dict.hero.title2}
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-word" style={{ '--word-delay': '370ms' } as CSSProperties}>
                {dict.hero.title3}
              </span>{' '}
              <span
                className="hero-word"
                style={{ '--word-delay': '480ms' } as CSSProperties}
              >
                {dict.hero.title4}
              </span>
            </span>
          </h1>
          <div
            className="hero-paragraph flex flex-wrap items-center gap-3 mt-7"
            style={{ '--fade-delay': '620ms' } as CSSProperties}
          >
          <p
            className="hero-text-papragraph hero-fade text-base md:text-lg text-white/90 mt-4 max-w-lg leading-relaxed"
            style={{ '--fade-delay': '640ms' } as CSSProperties}
          >
            {dict.hero.subtitle}
          </p>
          </div>
          <div
            className="hero-fade flex flex-wrap items-center gap-3 mt-7"
            style={{ '--fade-delay': '780ms' } as CSSProperties}
          >
            {/* On a brown card the brown button would vanish, so the primary
                action inverts to ivory-on-brown — the strongest pairing here. */}
            <Link
              href="/shop"
              className="btn bg-[#faf6f0] text-primary hover:bg-white px-7 py-3.5 text-sm"
            >
              <span>{dict.hero.ctaPrimary}</span>
              <Icon name="arrow_forward" className="flip-rtl !text-[20px]" />
            </Link>
            <Link href="/#story" className="btn btn-ghost px-7 py-3.5 text-sm text-white">
              {dict.hero.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>

      <Link
        href="/#categories"
        className="hero-scroll hero-fade hidden md:flex flex-col items-center gap-2 text-white/85"
        style={{ '--fade-delay': '1000ms' } as CSSProperties}
      >
        <span className="text-[11px] uppercase tracking-widest">{dict.hero.scroll}</span>
        <Icon name="expand_more" className="animate-bounce" />
      </Link>
    </section>
  );
}

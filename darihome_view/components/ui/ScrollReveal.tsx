'use client';

import { useEffect } from 'react';

/**
 * Reveals elements with the `.reveal` class as they scroll into view — the
 * React port of initReveal() from the template's main.js.
 *
 * It mounts once (in the layout) and uses a MutationObserver to catch `.reveal`
 * nodes that appear later — after client-side navigation or when a route's
 * Suspense content (e.g. shop/loading.tsx) streams in. Without this, content
 * navigated to client-side would stay at opacity:0 until a full refresh.
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Without a working observer we simply leave everything visible (the CSS
    // default) — no hiding, no risk of stuck-invisible content.
    const io =
      !reduce && 'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries, obs) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('is-visible');
                  obs.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
          )
        : null;

    const scan = () => {
      if (!io) return;
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      document
        .querySelectorAll<HTMLElement>(
          '.reveal:not(.is-visible):not(.reveal-pending)',
        )
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          const inView = rect.top <= vh && rect.bottom >= 0;
          if (inView) {
            // Already on screen — leave it visible; just mark it processed.
            el.classList.add('is-visible');
          } else {
            // Below the fold — hide it, then animate in when it scrolls into view.
            el.classList.add('reveal-pending');
            io.observe(el);
          }
        });
    };

    scan();

    // Coalesce mutation bursts into one scan per frame.
    let scheduled = false;
    const mutation = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        scan();
      });
    });
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}

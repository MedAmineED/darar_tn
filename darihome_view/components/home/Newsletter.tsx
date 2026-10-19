'use client';

import { useState, type FormEvent } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

/**
 * Newsletter sign-up. There is no subscription backend yet, so this mirrors the
 * template's client-only behavior: validate, then acknowledge. Ported from
 * initForms() in main.js.
 */
export function Newsletter({ dict }: { dict: Dictionary }) {
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('email') as HTMLInputElement | null;
    if (input && input.value.trim()) {
      form.reset();
      setDone(true);
    }
  };

  return (
    <section id="newsletter" className="py-20 md:py-28">
      <div className="max-w-container mx-auto px-5 md:px-16">
        <div className="reveal bg-primary text-on-primary rounded-lg px-6 py-14 md:p-20 text-center relative overflow-hidden">
          <div className="absolute -top-16 -end-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -start-10 w-72 h-72 rounded-full bg-white/5" />
          <div className="relative max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-semibold">
              {dict.news.title}
            </h2>
            <p className="mt-4 opacity-85">{dict.news.subtitle}</p>
            <form
              onSubmit={onSubmit}
              className="flex flex-col sm:flex-row gap-3 mt-8 max-w-md mx-auto"
            >
              <label className="sr-only" htmlFor="nl-email">
                {dict.news.placeholder}
              </label>
              <input
                id="nl-email"
                name="email"
                type="email"
                required
                placeholder={dict.news.placeholder}
                className="flex-1 rounded px-4 py-3.5 text-on-surface bg-white border-0 focus:ring-2 focus:ring-wood outline-none"
              />
              <button
                type="submit"
                className="btn bg-wood text-primary px-7 py-3.5 text-sm hover:bg-white transition-colors"
              >
                {dict.news.button}
              </button>
            </form>
            <p className={`text-xs mt-4 ${done ? 'text-wood' : 'opacity-70'}`}>
              {dict.news.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

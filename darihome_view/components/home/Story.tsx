import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '@/components/ui/Icon';

export function Story({ dict }: { dict: Dictionary }) {
  return (
    <section id="story" className="py-20 md:py-28 mt-8 bg-surface-low">
      <div className="max-w-container mx-auto px-5 md:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="reveal relative">
            <div className="card-media rounded-lg overflow-hidden aspect-[4/5] relative">
              <Image
                src="/assets/images/about_pic.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="hidden md:block absolute -bottom-6 -end-6 bg-primary text-on-primary rounded-lg p-6 w-44 shadow-xl">
              <p className="font-display text-3xl font-bold">{dict.story.stat3n}</p>
              <p className="text-xs uppercase tracking-widest mt-1 opacity-80">
                {dict.story.stat3l}
              </p>
            </div>
          </div>

          <div className="reveal" style={{ '--reveal-delay': '120ms' } as CSSProperties}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              {dict.story.eyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              {dict.story.title}
            </h2>
            <p className="text-lg text-on-surface-variant mt-6 leading-relaxed">
              {dict.story.body}
            </p>
            <div className="mt-10">
              <div className="border-t-2 border-primary pt-4">
                <p className="font-display text-4xl font-bold">{dict.story.stat1n}</p>
                <p className="text-sm text-on-surface-variant mt-1">{dict.story.stat1l}</p>
              </div>
            </div>
            <Link href="/shop" className="btn btn-primary px-8 py-4 text-sm mt-10">
              <span>{dict.story.cta}</span>
              <Icon name="arrow_forward" className="flip-rtl !text-[20px]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

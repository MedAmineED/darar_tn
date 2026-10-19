import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Marquee({ dict }: { dict: Dictionary }) {
  const items = [
    dict.marquee.a,
    dict.marquee.b,
    dict.marquee.c,
    dict.marquee.d,
    dict.marquee.e,
  ];

  const Group = ({ hidden = false }: { hidden?: boolean }) => (
    <span className="inline-flex items-center gap-14" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-14">
          <span>{item}</span>
          <span className="text-wood">✦</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="marquee bg-primary text-on-primary py-4 select-none">
      <div className="marquee__track text-sm font-semibold uppercase tracking-widest">
        <Group />
        <Group hidden />
      </div>
    </div>
  );
}

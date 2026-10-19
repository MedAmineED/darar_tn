import { BadRequestException } from '@nestjs/common';

const TUNIS_OFFSET_MS = 3_600_000;
const DAY_MS = 86_400_000;

export interface OptionalRange {
  from: string | null;
  to: string | null;
  /** Inclusive start instant, or null for "since the beginning". */
  start: Date | null;
  /** Exclusive end instant, or null for "until now". */
  end: Date | null;
}

function parse(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException({
      message: 'Invalid date (use YYYY-MM-DD)',
      code: 'INVALID_DATE',
    });
  return date;
}

/** Africa/Tunis calendar dates → [start, end) instants; either side optional. */
export function optionalRange(from?: string, to?: string): OptionalRange {
  const start = from ? new Date(parse(from).getTime() - TUNIS_OFFSET_MS) : null;
  const end = to
    ? new Date(parse(to).getTime() + DAY_MS - TUNIS_OFFSET_MS)
    : null;
  if (start && end && start >= end)
    throw new BadRequestException({
      message: '"from" must be on or before "to"',
      code: 'INVALID_DATE_RANGE',
    });
  return { from: from ?? null, to: to ?? null, start, end };
}

/** Bookkeeping dates are stored at noon UTC so they never shift a day. */
export function bookDate(value: string): Date {
  return new Date(`${parse(value).toISOString().slice(0, 10)}T12:00:00.000Z`);
}

export function dateFilter(range: OptionalRange) {
  if (!range.start && !range.end) return undefined;
  return {
    ...(range.start ? { gte: range.start } : {}),
    ...(range.end ? { lt: range.end } : {}),
  };
}

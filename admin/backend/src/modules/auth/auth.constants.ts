export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

const DURATION_PATTERN = /^(\d+)([smhd])$/;

const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Parses durations like "15m", "7d", "3600s" into milliseconds. */
export function durationToMs(value: string): number {
  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${value}"`);
  }
  return Number.parseInt(match[1], 10) * UNIT_MS[match[2]];
}

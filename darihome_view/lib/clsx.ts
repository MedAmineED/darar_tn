/** Minimal className joiner — avoids a dependency for a one-line utility. */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(' ');
}

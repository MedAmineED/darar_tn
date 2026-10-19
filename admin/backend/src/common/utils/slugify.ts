const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Produces a URL-safe slug from Latin text (French names). Arabic-only input
 * yields an empty string, so callers should fall back to another source.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

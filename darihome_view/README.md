# Darya — Storefront (Next.js)

The public, visitor-facing storefront for **Darya / داريا**, built with
**Next.js (App Router) + TypeScript**. It is a separate application from the
admin platform and consumes the NestJS **storefront API** — it never talks to
the database or Prisma directly.

```
Next.js storefront  ──HTTP/REST──▶  NestJS storefront API  ──▶  MySQL / Prisma
```

## Architecture

- **Server Components by default.** `"use client"` is used only for genuine
  interactivity (header/drawers, gallery zoom, quantity stepper, cart badge,
  language toggle, newsletter). Pages are server-rendered for SEO and fast TTFB.
- **Typed API layer** in `lib/api/` (`client.ts`, `products.ts`, `categories.ts`)
  — one place for base URL, timeouts, the `{ success, data }` envelope, error
  normalization and ISR revalidation. Components never call `fetch` directly.
  `lib/api/client.ts` is `server-only`, so API URLs never reach the browser.
- **i18n** (Arabic default / French) via a cookie the server reads
  (`lib/i18n/`), so both languages are SSR-correct. Product content comes from
  the API (`nameAr`/`nameFr`); UI strings live in `lib/i18n/dictionaries.ts`.
- **Design** ported from `template/` (the visual source of truth). Tailwind is
  compiled at build time (no Play CDN); the template's custom CSS lives in
  `app/globals.css`; fonts are self-hosted via `next/font` (Amiri/Tajawal for
  Arabic, Playfair/Inter for French); icons are inline SVGs (`components/ui/Icon`).

## Structure

```
app/
  layout.tsx            root: fonts, locale, header/footer, base metadata
  page.tsx              home (SSR): hero, categories, featured, story, newsletter
  shop/page.tsx         shop (SSR): URL-based filters/sort/pagination
  products/[slug]/…     product (SSR): gallery, buy box, generateMetadata, JSON-LD
  not-found · error · shop/loading · sitemap.ts · robots.ts
components/  layout · home · shop · product · cart · ui · seo
lib/         api · i18n · shop · media · format
public/assets/images  design imagery copied from the template
```

## Run

```bash
cp .env.example .env.local     # point API_BASE_URL at the running backend
npm install
npm run dev                    # http://localhost:3100 (see package.json)
```

The NestJS backend must be running (`admin/backend`, port 4000) and expose the
public `storefront` module.

For the current native preview, use **API 4101**, public shop **3000**, and admin
**3200/3201**. See [the shared local setup](../LOCAL_DEVELOPMENT.md). The Docker
API on 4000 has a different database; using it here while the admin uses 4101
shows different products. Keep `API_BASE_URL`, `MEDIA_BASE_URL`, and the admin's
`NEXT_PUBLIC_API_URL` aligned with the same environment.

```bash
npm run build && npm start     # production
npm run typecheck              # tsc --noEmit
npm run lint
```

## Environment

| Var | Purpose |
|---|---|
| `API_BASE_URL` | NestJS storefront API base (incl. `/api/v1`). **Server-only.** |
| `MEDIA_BASE_URL` | Host serving `/uploads/**` product images (defaults to the API origin). |
| `NEXT_PUBLIC_SITE_URL` | Canonical storefront origin (SEO: canonical, OG, sitemap). |

No backend secrets are exposed to the browser; nothing sensitive is prefixed
`NEXT_PUBLIC_`.

## SEO

- Per-product dynamic metadata via `generateMetadata()` (title, description,
  canonical, Open Graph, Twitter).
- `Product` + `BreadcrumbList` JSON-LD on product pages (public-safe fields only).
- `robots.txt` and a `sitemap.xml` that paginates the full catalogue.
- Clean URLs: `/shop`, `/products/<slug>`. Missing products return a real `404`.

## Notes / deferred

- **Cart & newsletter** are client-only placeholders (no backend yet) — they
  mirror the template's ephemeral behavior without faking a real basket.
- The template's decorative **wood-finish / price-range** filters were dropped
  in favour of the filters the API actually supports (category, sort, search),
  to avoid non-functional controls.
- `template/` is kept as the design reference; it is not part of the build.

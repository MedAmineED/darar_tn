# Darya Admin — Frontend

Next.js (App Router) + TypeScript administration dashboard for Darya.

Implemented: protected Arabic/RTL and French/LTR catalog, customers/orders, delivery settings, inventory and analytics dashboard. Sessions use in-memory access tokens and httpOnly refresh cookies.

## Stack

- **Next.js 15** App Router, **React 19**, strict **TypeScript**
- **Tailwind CSS** themed from `library/admin_ref` (wood/umber palette,
  IBM Plex Sans Arabic + Inter), **RTL / Arabic** by default
- **TanStack Query** for server state, **react-hook-form + zod** for forms
- **axios** client with an access-token-in-memory + transparent 401→refresh
  interceptor; refresh cookie sent via `withCredentials`
- **sonner** toasts, **lucide-react** icons

## Requirements

- Node.js 20+ (developed on 22)
- The backend API running (see `../backend`)

## Setup

```bash
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm install
npm run dev                    # http://localhost:3000
```

Sign in with the seeded SUPER_ADMIN credentials from the backend
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

The current native preview uses API **4101** and admin **3200/3201**, with the
public shop on **3000**. Both clients must target the same API/database. The
Docker API on 4000 is a separate environment. See
[the local stack configuration](../../LOCAL_DEVELOPMENT.md). Changing
`NEXT_PUBLIC_API_URL` requires rebuilding a production frontend.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend base URL incl. prefix, e.g. `http://localhost:4000/api/v1` |

## How auth works on the client

1. On load, `AuthProvider` calls `POST /auth/refresh`; if the cookie is valid it
   stores the returned access token **in memory** and marks the session active.
2. `(dashboard)` routes are guarded — unauthenticated users are sent to `/login`.
3. The axios response interceptor refreshes once on a `401` and retries; if the
   refresh fails the session is cleared and the user returns to `/login`.
4. Nav items are filtered by the user's permissions (`SUPER_ADMIN` sees all).

## Project structure

```
src/
├── app/
│   ├── (auth)/login/         login screen
│   ├── (dashboard)/          protected layout + dashboard page
│   ├── layout.tsx            RTL root layout, fonts, providers
│   └── globals.css
├── components/{ui,layout}/   reusable UI kit + shell (sidebar/header/breadcrumbs)
├── config/                   nav items + Arabic UI strings
├── lib/api/                  typed axios client, auth calls, token store, types
└── providers/                AuthProvider + QueryProvider
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Inventory and analytics

- The header and login language switch cover the entire admin. Arabic remains
  the default; French uses LTR, Inter typography and TND price labels. The choice
  persists in `darya-admin-locale` localStorage and synchronizes between tabs on
  the same origin. Product names/descriptions remain separate bilingual fields.
- Product creation has an opening-stock section: quantity, low-stock threshold
  and conditional reason, visible to users with `inventory:adjust`. Existing
  product edits link to stock management instead of overwriting quantities.
- Stock offers **Receive stock** with paginated product search, a positive
  received quantity, projected balance and required reason. **New product** opens
  creation with an inventory return path; receipts are also available per row.
  Manual signed adjustments and threshold changes remain separate actions.

- `/inventory`: server-side Arabic/French name/SKU search, availability/status/
  category filters, stable sorting and pagination. `?availability=LOW|OUT|IN` and
  `?search=SKU` support dashboard links. Quantity adjustments require a signed
  change and reason; threshold-only edits require a reason. Movement history
  shows actor, reason, order link, delta, resulting balance and Tunis time.
- Permissions gate navigation, read queries and stock controls. `inventory:read`
  exposes balances/history, `inventory:adjust` exposes adjustment/threshold forms.
  API authorization remains authoritative, including immediate grant revocation.
- New orders offer PENDING/CONFIRMED only. Detail shows stock state and allowed
  fulfilment transitions. Confirmation fails when any product is short. Legacy
  orders show their exemption; refunds alone do not restore physical stock.
- `/dashboard`: 7/30/90/365-day presets plus inclusive custom Tunisia dates up to
  366 days, previous-period comparisons, revenue/AOV/orders/units/customers,
  accessible daily charts/tables, status/payment breakdowns, top10 products,
  current stock alerts and recent10 orders. Zero previous baseline has no percent.
  Loading, empty, validation, query errors and retries are explicit.
- Revenue means paid non-cancelled order totals (discounted, including shipping);
  refunded/unpaid/failed orders do not count. Dates attribute to order creation.
  Top-product line value is before order-level discount/shipping. See the backend
  README for the complete stock lifecycle and analytics definitions.
- TanStack Query invalidates inventory/dashboard after product/order/stock changes.
  Frontend dependencies/configuration remain independent from the backend.

Stop the dev server before `npm run build`. If a live preview must remain open,
build a separate copy under `/tmp` with its own `.next` output; never share a live
dev server's output directory with a production build. Verify lint, TypeScript,
production build and browser DOM at desktop/mobile widths before shipping.

Remaining: user/role management screens, variants/warehouses/reservations,
returns intake, payment-event accounting and the separately planned customers SSR
application. Existing products need physical counts entered through inventory;
initial migration balances intentionally start at zero.

## Interface motion

The compact layout keeps all controls visible. Motion uses a shared 200ms ease-out
transition, with 140ms modal exits: route content enters once per navigation,
active navigation highlights move between links, dialogs fade/scale in and out,
and the mobile drawer follows the current writing direction. Filter chips,
buttons, form focus and toggles provide short interaction feedback.

The frontend-only `motion` dependency supplies presence handling so conditionally
mounted stock dialogs can finish closing. Modal portals avoid transformed page
ancestors; dialogs trap Tab, support Escape and restore opening-button focus.
Exiting overlays are inert and release pointer events immediately. Navigation is
not delayed to wait for an outgoing page, and background updates do not replay a
page entrance. OS reduced-motion preferences remove travel and animation delays.

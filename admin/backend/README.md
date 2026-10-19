# Darya Admin — Backend

NestJS + Prisma + MySQL REST API for the Darya administration platform.

Implemented: authentication/RBAC, catalog and images, customers/orders, storefront checkout API, delivery settings, inventory and dashboard analytics. Frontend and backend remain separate applications.

## Stack

- **NestJS 10** (modular, DI, guards/interceptors/filters)
- **Prisma 6** ORM against **MySQL 8**
- **JWT** access tokens + **httpOnly cookie** refresh tokens (rotated & revocable)
- **class-validator** DTOs, **zod**-validated environment
- **Swagger** API docs

## Requirements

- Node.js 20+ (developed on 22)
- A running MySQL 8 instance

## Setup

```bash
cp .env.example .env          # then edit DATABASE_URL, JWT secrets, seed admin
npm install
npm run prisma:generate
npm run prisma:migrate        # creates the database + tables
npx prisma db seed            # roles, permissions, SUPER_ADMIN, example categories
npm run start:dev
```

API runs at `http://localhost:4000/api/v1`. Swagger UI at
`http://localhost:4000/api/v1/docs`.

## Environment

See [`.env.example`](.env.example). Never commit a real `.env`. Key variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets (min 16 chars) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (`15m`, `7d`) |
| `REFRESH_COOKIE_NAME`, `COOKIE_SECURE`, `COOKIE_SAME_SITE` | Refresh cookie config |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `SEED_ADMIN_*` | Initial SUPER_ADMIN credentials (seed only) |

## Auth flow

1. `POST /auth/login` → returns `{ accessToken, user }` and sets an httpOnly
   refresh cookie scoped to `/api/v1/auth`.
2. Send `Authorization: Bearer <accessToken>` on protected requests.
3. On expiry, `POST /auth/refresh` (cookie sent automatically) rotates the
   refresh token and returns a new access token.
4. `POST /auth/logout` revokes the refresh token and clears the cookie.

## Authorization

- Roles are data (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, + custom).
- Permissions are `resource:action` strings, seeded and assigned to roles.
- Protect routes with `@RequirePermissions('product:create')` (+ `PermissionsGuard`)
  or `@Roles('ADMIN')` (+ `RolesGuard`). `SUPER_ADMIN` bypasses permission checks.
- Roles/permissions are resolved per request, so revocation is immediate.

## Project structure

```
src/
├── config/       zod env validation + typed AppConfigService
├── common/       exception filter, response interceptor, guards, decorators, dto
├── prisma/       global PrismaModule + PrismaService
└── modules/
    ├── auth/         login/refresh/logout/me/change-password, JWT strategy
    ├── users/        CRUD + role assignment (controller/service/repository)
    ├── roles/        CRUD + permission assignment
    ├── permissions/  read-only catalog (grouped)
    └── audit/        audit log service + read endpoint
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint (`--fix`) |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:studio` | Prisma Studio |
| `npx prisma db seed` | Seed roles/permissions/admin/categories |

## Inventory (2026-10-15)

Product creation also accepts opening stock: `POST /products` supports optional
`initialQuantity`, `lowStockThreshold` (integers 0–1,000,000,000), and `stockReason`.
A positive quantity or threshold requires a nonblank reason (1–500 characters)
and `inventory:adjust` in addition to `product:create`. Zero/omitted fields keep
catalog-only creation available. Product, balance, opening movement and audits
commit in the same transaction. Threshold-only creation is audited without a
zero-quantity movement. These three fields are rejected by `PATCH /products/:id`;
subsequent quantities must use inventory movements. No new migration is needed.

`GET /inventory` and `GET /inventory/:productId/movements` require `inventory:read`.
Both accept page/limit/search/sortBy/sortOrder; balances filter by availability
(`IN`, `LOW`, `OUT`), publication status and categoryId; history filters by kind.
`POST /inventory/:productId/adjustments` requires `inventory:adjust` and
`{ delta, reason, lowStockThreshold? }`. Delta is a nonzero signed integer;
reason must be nonblank. `PATCH /inventory/:productId/threshold` accepts
`{ lowStockThreshold, reason }` under the same permission. Threshold edits are
audited without inventing stock movements. Balances cannot become negative.

Products get a separate zero balance on creation. Count physical stock and add
it through reasoned adjustments. All pre-migration orders are LEGACY, including
pending orders; they never deduct or restore. New orders start PENDING or
CONFIRMED only. Confirmation atomically deducts aggregate product quantities;
shortage rolls back the whole order/status change. Cancellation atomically
restores only prior deductions, once. Same-status retries never move stock twice.
Cancellation is terminal; fulfilment advances CONFIRMED -> PROCESSING -> SHIPPED
-> DELIVERED. Refund alone does not restore goods. Stock state is returned as
`stockState` on order detail/creation. `POST /orders` accepts an optional `Idempotency-Key` header (8–128 URL-safe
characters). Reuse the same key and identical payload for creation retries;
its identity is scoped to the authenticated actor. Concurrent retries return
one durable order and deduct once. Reusing a key with a changed payload returns
409 `IDEMPOTENCY_KEY_REUSED`. The admin form supplies a stable key while mounted.
Independent submissions without a key are separate orders.

Order locks, sorted product locks, conditional balance updates, unique
order/product/movement-kind entries, and ledger state live in one transaction.
Stock adjustments and their audit/movement records also commit together.
Products with movements must be archived; deleting them would destroy history
and is restricted by foreign keys. Existing line snapshots remain immutable.
ADMIN has inventory read/adjust; MANAGER has read. Custom-role grants are retained
by the migration; permission checks still resolve every request.

### Deployment and verification

Stop **all old API writers**, including checkout instances, before deploying
`20261015090000_inventory_analytics` and
`20261015160000_order_creation_idempotency`; MySQL DDL/backfill is not an atomic rollout.
Run `npm run prisma:deploy`, then `npm run prisma:generate`, build and restart all
API instances. Start the matching frontend only after migration. Do not run the
demo seed against a live catalog; the migration installs the new grants itself.
Back up the database before deployment. Existing balances begin at zero and no
historical sales are deducted. Do not roll back by dropping movement tables.

```bash
npm test -- --runInBand
RUN_INVENTORY_DB_TESTS=1 RUN_DASHBOARD_INTEGRATION=1 npm test -- --runInBand
npm run lint
npm run build
npm run prisma:deploy
```

Opt-in tests require the configured local MySQL database, create uniquely named
fixtures and clean only those fixtures. They cover final-unit races, same-order
retries, direct confirmation, duplicate lines, rollback, legacy exemption,
concurrent adjustments, snapshot preservation, refund policy, creation-key
retries and HTTP validation/permission denial/immediate revocation.

## Dashboard definitions

`GET /dashboard/stats?from=YYYY-MM-DD&to=YYYY-MM-DD` requires `dashboard:read`.
Both dates are optional together (default last30), inclusive in Tunisia UTC+1;
maximum 366 days. Comparison is the immediately previous equal number of calendar
days. Revenue sums totalAmount for **PAID, non-CANCELLED** orders, after discounts
and including shipping. Unpaid/failed/refunded/cancelled orders contribute zero
revenue or sold units. AOV uses that same paid order count. Order totals/status
and payment breakdowns include all orders. Customers counts newly created customer
records, excluding guest contacts. Attribution uses creation date; later refunds
restate the original cohort. Top products use frozen line totals before order
level discounts/shipping and report this explicitly. A zero previous baseline
returns null changePercent. No accounting payment event ledger is implied.

SQL performs daily/status/payment/product aggregations; JS sees at most 366
chart points, top10 products, recent10 orders and 8 stock alerts. Analytics reads
use one repeatable-read transaction. Orders(paymentStatus,status,createdAt),
Customer(createdAt), existing Order(createdAt) and OrderItem(orderId) indexes
support these queries. Inventory summaries are current across publication states,
independent of the selected sales dates.

Remaining: variants, reservations/stock holds, warehouses, returns intake separate
from cancellation, payment-event/refund accounting, promotions, notifications and
the planned customers SSR app. The public cart accepts pending requests without
reserving stock; availability is enforced at confirmation.

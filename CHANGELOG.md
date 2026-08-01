# Changelog

All notable changes to Morel OS are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [Semantic Versioning](https://semver.org/) — while
the project is pre-1.0 (`0.x.y`), minor bumps may include breaking
internal restructuring, and patch bumps are used for non-functional
changes (documentation, internal reorganization) as well as fixes.

## [Unreleased]

Nothing pending beyond what's tracked in `docs/ROADMAP.md`.

## [0.3.1] - 2026-07-31

Documentation refresh reflecting Sprint 3 and Sprint 4's completion. No
application code changed in this release, consistent with this
project's policy that documentation-only work is a patch bump.

### Changed
- `docs/PROJECT_STATUS.md` — current phase moved to Sprint 5 (not yet
  started); Sprint 3/4 added to Completed Modules; the now-stale "real
  backend"/"CI" pending items removed (both shipped); the accessibility
  pending item narrowed to specifically the payment step, since the
  Entrega step gained a real `<form>` in Sprint 4; a new pending item
  recorded for rate limiting, since Sprint 4's polling increases call
  volume against already-public, unauthenticated procedures.
- `docs/ROADMAP.md` — Sprint 3 and Sprint 4 marked ✅ Complete.
- `docs/BACKEND_ARCHITECTURE.md` — §19 Phases 0–4 marked ✅ Complete;
  §21's risk-table rows for the four risks Sprint 3/4 resolved (the
  `use-order-progress.ts` rewrite, the cart-store/services persistence
  duplication, `saveOrder` idempotency, delivery-slot capacity) updated
  to record what was actually resolved and, where the actual approach
  differed from the original recommendation, how and why.

## [0.3.0] - 2026-07-31

Sprint 4 — Service Layer Cutover & Live Order Status.

### Added
- Vanilla `@trpc/client` (`lib/trpc-client.ts`) — no TanStack Query; see
  `docs/DECISIONS.md` for why.
- `saveOrder` request idempotency (required, client-supplied UUID key,
  checked first in the transaction) and delivery-slot capacity
  enforcement (atomic conditional decrement), closing both gaps
  deliberately deferred from Sprint 3.
- Checkout collects real customer name/email/phone, wrapped in a real
  `<form>` with `autoComplete` hints (`docs/ENGINEERING_STANDARDS.md`
  §11), and persists a client-generated idempotency key across a
  refresh (`lib/checkout-store.ts`).
- Live order-status polling: a dedicated `ordersRouter.getOrderStatus`
  procedure (deliberately not a reuse of `getOrder`'s full query) and a
  rebuilt `hooks/use-order-progress.ts` replace the wall-clock
  simulation with real `OrderStatusEvent` polling (5-second interval,
  stopping once `ENTREGADO` is reached). A missing/unreachable order now
  shows a real "Pedido no encontrado" state instead of fabricated demo
  data.

### Changed
- `services/orders.ts` now calls the real backend instead of
  `localStorage`; `generateOrderId()` is gone. Order-tracking links now
  display `orderNumber`, not the internal `id`.
- The order tracker's ETA and driver-map animation are now explicitly
  symbolic (static approximate ETA, poll-tick-driven map movement)
  rather than derived from a fixed fake timeline — no real GPS/ETA data
  source exists yet. See `docs/DECISIONS.md` for the full reasoning.

## [0.2.0] - 2026-07-31

Sprint 3 — Backend Foundation Implementation.

### Added
- CI pipeline: build, lint, `npm ci` (lockfile integrity), and
  `npm audit` as required checks; CI-gated `prisma migrate deploy`.
- Initial Prisma schema, migration, and generated client, backed by a
  standalone Neon Postgres database.
- `prisma/seed.ts`, seeding the database from `data/*.ts` — byte-identical
  to the existing mock catalog/demo data — plus explicitly marked
  placeholder values for the DR-specific fields absent from the
  Argentina-themed mock data.
- tRPC infrastructure (`server/trpc/`) and three routers: `catalogRouter`
  and `deliveryRouter` (read-only), and `ordersRouter` (`getOrder`
  read-only, `saveOrder` guest checkout).
- Guest checkout in `saveOrder`: customer identity resolved by email
  (auto-creates `User`+`Customer`, never overwrites an existing
  customer's stored name/phone), default `Branch` discovered from the
  database, totals computed server-side in `Prisma.Decimal`, and an
  opaque `Order.id` (`cuid()`) with a separate `orderNumber` for
  display — closing the enumerable-order-id gap flagged in
  `docs/DECISIONS.md`.

### Changed
- None of this release's new backend surface is wired into any
  component yet — `services/orders.ts` still reads/writes
  `localStorage`, matching `docs/BACKEND_ARCHITECTURE.md` §19 Phase 2's
  explicit "ship alongside the existing implementation" sequencing.

## [0.1.2] - 2026-07-31

Architecture freeze — concludes the Architecture & Engineering phase.
No application code changed in this release, consistent with this
project's policy that documentation-only work is a patch bump.

### Added
- `docs/BACKEND_ARCHITECTURE.md` — full backend design (tRPC,
  PostgreSQL/Neon, Prisma, Auth.js, Inngest, Upstash, Azul/CardNet,
  Twilio WhatsApp), re-scoped to the Dominican Republic as the target
  market, with a formal decision-analysis framework, ER diagram, and
  Prisma schema sketch. Design only — nothing implemented.
- `docs/SECURITY_ARCHITECTURE.md`, `docs/INFRASTRUCTURE_ARCHITECTURE.md`,
  `docs/ENGINEERING_STANDARDS.md` — three permanent, binding engineering
  standards documents.
- New `docs/DECISIONS.md` entries recording the backend architecture and
  DR re-scope decisions, and the standards-creation/review decision.

### Changed
- Independent architecture review of all four documents together,
  resulting in fixes to internal cross-references, a supersession note
  resolving duplicated policy between `docs/BACKEND_ARCHITECTURE.md` §16
  and `docs/SECURITY_ARCHITECTURE.md`, an explicit CI-before-Phase-1
  sequencing requirement, and a documented bootstrap-admin mechanism.
- `docs/ROADMAP.md`'s Sprint 2–9+ plan renumbered and re-scoped to match
  the approved backend design's actual phase plan (Sprint 2 marked
  complete; Sprint 3 redefined as Backend Foundation), with the
  cross-reference cascade applied to `docs/DASHBOARD_SPEC.md`,
  `docs/ENGINEERING_STANDARDS.md`, `CONTRIBUTING.md`.
- `docs/PROJECT_STATUS.md` updated to reflect the architecture freeze,
  current phase, and next milestone.
- Tagged `v0.1.2-architecture-baseline`.

## [0.1.1] - 2026-07-30

### Added
- Full project documentation set: `docs/ARCHITECTURE.md`,
  `docs/PROJECT_STATUS.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`,
  `docs/DASHBOARD_SPEC.md`, and root-level `PRODUCT_VISION.md`,
  `CONTRIBUTING.md`, `CHANGELOG.md` (Sprint 1.5 — Project Documentation &
  Standards).

### Changed
- Reorganized the codebase into `config/`, `constants/`, `data/`,
  `hooks/`, `providers/`, `services/`, `types/` folders. Split the
  previously monolithic `lib/mock-data.ts` into domain-based files under
  `data/`. Relocated `lib/orders.ts` → `services/orders.ts` and
  `lib/use-order-progress.ts` → `hooks/use-order-progress.ts`.
  Centralized the delivery fee and `localStorage` key names, previously
  each duplicated in two places, into `constants/`.
  (Sprint 1 — Project Foundation.)
- No user-facing behavior changed in this release — verified via full
  manual walkthrough plus a clean `npm run build` / `npm run lint` before
  and after.

## [0.1.0] - 2026-07-30

Initial demo release. Built as a fully mocked, client-side-only sales
demo for Supermercados Morel — no backend, no external dependencies,
deployed to Vercel with zero configuration. Frozen forever as git tag
`demo-v1`.

### Added
- Landing page (`/`): hero, animated product mockup, feature highlights,
  "how it works" section, closing CTA.
- Storefront (`/tienda`): 43-product catalog across 10 categories, search,
  category filters.
- Cart: add/remove/adjust quantity, persisted across reloads, per-item
  "nunca sustituir" (never substitute) preference with smart defaults
  based on product type.
- Checkout (`/tienda/checkout`): 4-step wizard — substitution review,
  delivery slot picker with realistic capacity states, mock payment
  (explicitly non-functional, clearly labeled), animated confirmation.
- Live order tracking (`/pedido/[id]`): animated vertical status timeline,
  illustrated live map with a moving driver icon and ETA countdown,
  self-firing toast notifications simulating real-time updates.
- Ops dashboard v0 (`/admin`): KPI cards, weekly sales/orders chart,
  kanban board of orders by status.
- Deployed to Vercel (`morel-os.vercel.app`) and GitHub
  (`davidcachan11-coder/morel-os`).

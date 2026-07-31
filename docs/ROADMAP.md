# Roadmap

This roadmap is organized into three horizons: **MVP** (done), **Production
V1** (in progress — where we are now), and **Future AI Roadmap** (not yet
started, directional). Within Production V1, work is grouped into
sprints; see `docs/PROJECT_STATUS.md` for exactly which sprint is current
and `CHANGELOG.md` for the dated record of what's shipped.

---

## Milestone 1 — MVP (Complete)

**Goal:** A fully mocked, front-end-only demo good enough to run live in a
client sales meeting — indistinguishable from a real product at a glance,
with zero backend dependency.

- [x] Landing page with hero, feature highlights, animated product mockup
- [x] Storefront (`/tienda`): 43-product catalog, search, category filters
- [x] Cart: add/remove/adjust quantity, per-item "never substitute" preference, persisted across reloads
- [x] Checkout wizard: substitution review → delivery slot picker → mock payment → confirmation
- [x] Live order tracking (`/pedido/[id]`): animated status timeline, illustrated live map with moving driver + ETA, self-firing toast notifications
- [x] Ops dashboard v0 (`/admin`): KPI cards, weekly sales chart, kanban board by order status
- [x] Deployed to Vercel, zero external dependencies, zero config
- [x] Demo frozen forever at git tag `demo-v1`

**Explicitly out of scope for MVP** (by design, not oversight): backend,
auth, real payments, tests, CI.

---

## Milestone 2 — Production V1 (In Progress)

**Goal:** Turn the MVP's solid front-end foundation into something that can
safely take real data, real users, and real traffic — without a rewrite.
This milestone is deliberately broken into small, low-risk sprints rather
than one large "productionize everything" effort.

### Sprint 1 — Project Foundation ✅ Complete
Folder architecture (`config/`, `constants/`, `data/`, `hooks/`,
`providers/`, `services/`, `types/`), domain-split mock data, zero
functional change.

### Sprint 1.5 — Project Documentation & Standards ✅ Complete
`docs/`, `PRODUCT_VISION.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.

### Sprint 2 — Backend Architecture & Data Model Design ✅ Complete
Comprehensive backend architecture designed (not implemented): technology
stack (tRPC + PostgreSQL/Neon + Prisma + Auth.js + Inngest + Upstash +
Azul/CardNet + Twilio WhatsApp), re-scoped to the Dominican Republic as
the target market, complete entity model and Prisma schema sketch, and a
7-phase migration strategy. Includes three permanent standards documents
(`docs/SECURITY_ARCHITECTURE.md`, `docs/INFRASTRUCTURE_ARCHITECTURE.md`,
`docs/ENGINEERING_STANDARDS.md`), independently reviewed and refined
before approval. See `docs/BACKEND_ARCHITECTURE.md` for the full design.

### Sprint 3 — Backend Foundation Implementation (Next)
Implements `docs/BACKEND_ARCHITECTURE.md` §19 Phase 0–2: stand up CI
(build/lint/audit gates, CI-gated `prisma migrate deploy` — a
prerequisite for every other implementation sprint below, not a
parallel-track item), provision the Postgres database and seed it from
`data/*.ts` (byte-identical to today's mock catalog/demo data), and stand
up the tRPC layer mirroring `services/`'s function shapes — built
alongside the existing `localStorage` implementation, not yet wired to
any component.

### Sprint 4 — Service Layer Cutover & Live Order Status (Planned)
Phase 3–4: resolve the `lib/cart-store.ts`/`services/orders.ts`
persistence-pattern duplication flagged in `docs/DECISIONS.md` (a
prerequisite, per `docs/BACKEND_ARCHITECTURE.md` §19's own note — not
optional), swap `services/orders.ts`'s implementation to call the real
backend without changing its exported signatures, then replace
`hooks/use-order-progress.ts`'s wall-clock simulation with a subscription
to real `OrderStatusEvent` data (polling to start).

### Sprint 5 — Authentication, MFA & Admin Gating (Planned)
Phase 5: real user accounts/sessions via Auth.js, the bootstrap-admin
path (`docs/BACKEND_ARCHITECTURE.md` §6), MFA enforcement for
`finance`/`ops_manager`/`admin` (`docs/SECURITY_ARCHITECTURE.md` §4.2),
and gating `/admin` behind the role checks in §7 — currently fully
public, the single highest-priority security gap. Introduces the first
entry in `providers/`.

### Sprint 6 — Payments & Fiscal Compliance (Planned)
Phase 6: hosted/tokenized checkout via Azul (primary) and CardNet
(secondary/failover), Cash on Delivery as a supported method with a
capped order value, and `FiscalReceipt`/`TaxCategory` (ITBIS) — these
ship together, not sequentially, per `docs/BACKEND_ARCHITECTURE.md` §19.
No raw card data is ever handled directly by this app's own code.

### Sprint 7 — Testing & CI Hardening (Planned)
Unit tests for the pure logic that's cheapest to test now:
`lib/cart-store.ts`'s reducers and the Phase-4 order-status logic, plus —
given their regulatory sensitivity — ITBIS/NCF computation
(`docs/ENGINEERING_STANDARDS.md` §8). Integration tests for tRPC routers
against a real test-database branch. (The CI pipeline itself is a Sprint
3 prerequisite, not part of this sprint — this sprint is about what runs
inside it.)

### Sprint 8 — Hardening (Planned)
Security headers (CSP, `X-Frame-Options`, `Referrer-Policy`) in
`next.config.ts` per `docs/SECURITY_ARCHITECTURE.md` §6.4. Accessibility
pass on the checkout wizard (real `<form>`, `autoComplete` hints, ARIA
single-select semantics for slot/category pickers). Adopt the
previously-scaffolded `config/brand.ts`, `theme.ts`, `navigation.ts`,
`seo.ts` into the components that currently hardcode the same values.

### Sprint 9+ — Dashboard Suite Build-Out (Planned)
Phase 7: build out the remaining modules specified in
`docs/DASHBOARD_SPEC.md` (Executive, Inventory, Customers, Marketing,
Finance, Employees), one at a time, each depending on the real backend
work above for real data.

---

## Milestone 3 — Future AI Roadmap (Directional, Not Started)

**Goal:** Once Production V1's foundation (real data, real auth, real
backend) exists, layer AI-assisted capabilities on top of it rather than
bolting them onto mock data. Nothing in this section is scheduled — it
exists to make sure near-term architecture decisions don't foreclose it.

- **AI Operations Center** (see `docs/DASHBOARD_SPEC.md`) — a dashboard
  module purpose-built to surface AI-generated operational insights
  (anomaly detection in order volume, staffing suggestions, delivery-time
  risk flags) rather than raw metrics.
- **Smart substitution suggestions** — today, "never substitute" is a
  manual per-item toggle; an AI layer could *recommend* which items are
  safe to auto-substitute based on historical acceptance patterns, with
  the manual toggle remaining as an override, not being replaced.
- **Demand forecasting** — feed real order history (once it exists) into
  inventory/staffing predictions, surfaced in the Inventory and Executive
  dashboards.
- **Conversational support** — an AI assistant for customer order
  questions ("where's my order," "can I still add an item") grounded in
  real order data via `services/orders.ts`'s eventual API-backed
  implementation.
- **Anomaly detection for operations** — flag unusual patterns (a branch
  falling behind on prep time, an unusual spike in substitutions) for the
  Operations and AI Operations Center dashboards.

None of this should be started before Production V1's data/auth/backend
milestones land — an AI feature built against mock data would need to be
rebuilt, not extended, once real data exists (the same lesson already
learned once with `hooks/use-order-progress.ts`).

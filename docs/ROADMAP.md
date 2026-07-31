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

### Sprint 1.5 — Project Documentation & Standards ✅ Complete (this sprint)
`docs/`, `PRODUCT_VISION.md`, `CONTRIBUTING.md`, `CHANGELOG.md` — this
document is part of it.

### Sprint 2 — Data Layer & Service Boundaries (Planned)
- Introduce a shared repository-style interface behind both
  `lib/cart-store.ts`'s persistence and `services/orders.ts`, resolving the
  two-different-patterns duplication flagged in `docs/DECISIONS.md`.
- Centralize the remaining hardcoded values noted in the pre-Sprint-1 audit
  (demo customer name, demo address) that weren't in scope for Sprint 1.

### Sprint 3 — Authentication & Access Control (Planned)
- Real user accounts/sessions.
- Gate `/admin` behind auth — currently fully public, flagged as the
  single highest-priority security gap.
- Introduce the first entry in `providers/` (an auth/session provider).

### Sprint 4 — Real Backend Integration (Planned)
- Introduce `app/api/` (or an external API) backing at least the order
  flow first (highest business value, already has a clean `services/`
  seam to swap).
- Replace `hooks/use-order-progress.ts`'s wall-clock simulation with real
  server-pushed status (polling or WebSocket).
- Migrate the product catalog from static `data/catalog.ts` to a real,
  queryable source once inventory needs to change without a redeploy.

### Sprint 5 — Payments (Planned)
- Replace the cosmetic checkout payment step with a real, PCI-compliant
  provider (Stripe, MercadoPago, or equivalent). No raw card data should
  ever be handled directly by this app's own code.

### Sprint 6 — Testing & CI (Planned)
- Unit tests for the pure logic that's cheapest to test now:
  `lib/cart-store.ts`'s reducers, `hooks/use-order-progress.ts`'s status
  derivation.
- GitHub Actions (or equivalent) running `build` + `lint` (+ tests once
  they exist) on every push/PR to `production-v1`.

### Sprint 7 — Hardening (Planned)
- Security headers (CSP, `X-Frame-Options`, `Referrer-Policy`) in
  `next.config.ts`.
- Accessibility pass on the checkout wizard (real `<form>`, `autoComplete`
  hints, ARIA single-select semantics for slot/category pickers).
- Adopt the previously-scaffolded `config/brand.ts`, `theme.ts`,
  `navigation.ts`, `seo.ts` into the components that currently hardcode
  the same values.

### Sprint 8+ — Dashboard Suite Build-Out (Planned)
Build out the remaining modules specified in `docs/DASHBOARD_SPEC.md`
(Executive, Inventory, Customers, Marketing, Finance, Employees), one at a
time, each depending on the real backend work above for real data.

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

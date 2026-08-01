# Project Status

**Last updated:** 2026-07-31
**Current branch:** `production-v1`
**Architecture Status:** Frozen — `docs/BACKEND_ARCHITECTURE.md`,
`docs/SECURITY_ARCHITECTURE.md`, `docs/INFRASTRUCTURE_ARCHITECTURE.md`,
and `docs/ENGINEERING_STANDARDS.md` are reviewed, approved, and finalized
as of commit `62a2be6`. Sprint 3 and Sprint 4 implementation did not
surface a need to revisit the core design — see `docs/DECISIONS.md` for
the handful of implementation-time refinements that did come up (e.g.
branch discovery, order-id scheme). No further architectural changes
until Sprint 5 surfaces a reason to revisit one.
**Current Phase:** Sprint 5 – Authentication, MFA & Admin Gating (not yet started)
**Next Milestone:** Land Auth.js, the bootstrap-admin path, MFA
enforcement, and `/admin` gating (`docs/BACKEND_ARCHITECTURE.md` §19
Phase 5) — see `docs/ROADMAP.md`
**Last completed sprint:** Sprint 4 – Service Layer Cutover & Live Order
Status, commit `0550cdb`, following Sprint 3 – Backend Foundation
Implementation, commit `7b9724a`, Sprint 2 – Backend Architecture & Data
Model Design, commit `62a2be6`, Sprint 1.5 – Project Documentation &
Standards, commit `f28ac6b`, and Sprint 1 – Project Foundation, commit
`a9db641`
**Frozen demo reference:** git tag `demo-v1` (commit `22af3ec`, also `main`) — see `docs/DECISIONS.md`

This document is a snapshot, not a history — see `CHANGELOG.md` for the
chronological record and `docs/DECISIONS.md` for the reasoning behind past
choices.

## Summary

Morel OS is past the "sales demo" phase and now has a real backend
powering its core flow end-to-end. The frozen demo itself — landing page,
storefront, checkout, live tracking, and an ops dashboard — remains
untouched at the `demo-v1` tag. Active development on `production-v1` has
completed five sprints: architecture (Sprint 1), documentation
(Sprint 1.5), backend architecture design (Sprint 2), backend foundation
implementation (Sprint 3 — CI, Postgres/Prisma, the tRPC layer, and guest
checkout via `saveOrder`), and service-layer cutover & live order status
(Sprint 4 — request idempotency, delivery-slot capacity enforcement,
`services/orders.ts`'s cutover from `localStorage` to the real backend,
and live `OrderStatusEvent` polling replacing the wall-clock simulation).
Checkout and order tracking (`/tienda/checkout`, `/pedido/[id]`) are now
backed by a real Postgres database — the payment step remains explicitly
cosmetic (Sprint 6), and nothing is authenticated yet (`/admin` included —
Sprint 5, next).

## Completed Modules

| Module | Route(s) | Status | Notes |
|---|---|---|---|
| Landing page | `/` | ✅ Complete | Hero, feature highlights, animated product mockup, CTA |
| Storefront | `/tienda` | ✅ Complete | 43-product catalog, search, category filters |
| Cart | (global, drawer) | ✅ Complete | Persisted via Zustand, per-item substitution preference |
| Checkout | `/tienda/checkout` | ✅ Complete, real backend | 4-step wizard: substitutions → delivery slot → mock payment → confirmation. Order submission is backed by the real database (guest checkout, idempotency, delivery-slot capacity); the payment step itself remains explicitly cosmetic ("Pago simulado") until Sprint 6 |
| Live order tracking | `/pedido/[id]` | ✅ Complete, real backend | Animated timeline, illustrated live map, toast notifications. Status now comes from real `OrderStatusEvent` polling (5s interval), not the old wall-clock simulation; ETA and driver-map movement are explicitly symbolic pending real GPS/dispatch data (a later sprint) — see `docs/DECISIONS.md`. Unknown/unreachable orders show a real "Pedido no encontrado" state |
| Ops dashboard (v0) | `/admin` | ✅ Complete, no auth | KPI cards, weekly sales chart, kanban board — see `docs/DASHBOARD_SPEC.md` for the full planned dashboard suite this is the first module of |
| Project Foundation (Sprint 1) | — | ✅ Complete | `config/`, `constants/`, `data/`, `hooks/`, `providers/`, `services/`, `types/` folders established; `lib/mock-data.ts` split by domain; zero functional change |
| Documentation (Sprint 1.5) | — | ✅ Complete | This file and the rest of `docs/`, plus root-level `PRODUCT_VISION.md`, `CONTRIBUTING.md`, `CHANGELOG.md` |
| Backend Architecture & Data Model Design (Sprint 2) | — | ✅ Complete, design only (nothing implemented) | `docs/BACKEND_ARCHITECTURE.md` (tRPC/PostgreSQL/Neon/Prisma/Auth.js/Azul/CardNet/Twilio stack, re-scoped to the Dominican Republic), `docs/SECURITY_ARCHITECTURE.md`, `docs/INFRASTRUCTURE_ARCHITECTURE.md`, `docs/ENGINEERING_STANDARDS.md` — independently reviewed and refined before approval |
| Backend Foundation Implementation (Sprint 3) | — | ✅ Complete | CI (build/lint/audit gates, CI-gated `prisma migrate deploy`); Postgres provisioned and seeded from `data/*.ts`; tRPC layer (`catalogRouter`, `deliveryRouter`, `ordersRouter`) stood up alongside (not yet wired to) the existing `localStorage` implementation; `saveOrder` guest checkout with opaque `Order.id`/display `orderNumber` |
| Service Layer Cutover & Live Order Status (Sprint 4) | — | ✅ Complete | `saveOrder` idempotency + delivery-slot capacity; checkout collects real customer identity; `services/orders.ts` cut over to the real backend (`generateOrderId()` removed); live order-status polling replaces the wall-clock simulation |

## Pending Modules

Nothing below has been started unless noted. Ordered roughly by what's
likely to unblock the most other work — see `docs/ROADMAP.md` for milestone
grouping and `docs/DASHBOARD_SPEC.md` for the dashboard-specific backlog.

- **Authentication** — no login, no sessions, no user accounts anywhere, including `/admin`, which is currently public. Design complete (`docs/BACKEND_ARCHITECTURE.md` §6, §7; `docs/SECURITY_ARCHITECTURE.md` §4); implementation is Sprint 5, next.
- **Real payments** — the checkout payment step is explicitly cosmetic ("Pago simulado"); no PCI-compliant provider is integrated. Design complete (`docs/BACKEND_ARCHITECTURE.md` §13); implementation is Sprint 6.
- **Testing** — no test runner installed, no test files exist. Standard defined (`docs/ENGINEERING_STANDARDS.md` §8); implementation is Sprint 7.
- **Security headers** — `next.config.ts` is unmodified from the `create-next-app` default; no CSP/`X-Frame-Options`/etc.
- **Accessibility hardening** — the checkout *payment* step specifically isn't a real `<form>` (no Enter-to-submit, no `autoComplete` hints) — the Entrega step's contact/address fields gained a real `<form>` in Sprint 4; delivery-slot/category pickers still aren't exposed as ARIA single-select groups.
- **Config adoption** — `config/brand.ts`, `theme.ts`, `navigation.ts`, `features.ts`, `seo.ts` are populated but not yet consumed by any component (see `docs/ARCHITECTURE.md` §7).
- **Remaining dashboard modules** — Executive, Inventory, Customers, Marketing, Finance, Employees, and AI Operations Center are all specced in `docs/DASHBOARD_SPEC.md` but not built; only Operations (v0) exists.
- **Rate limiting** — `getOrder`/`getOrderStatus`/`saveOrder` remain public, unauthenticated procedures with no rate limiting; Upstash is chosen for this (`docs/BACKEND_ARCHITECTURE.md` §1.7) but has no sprint assignment yet.

## Branch & Deployment State

- **`main`** — identical to the frozen demo (`demo-v1` tag, commit `22af3ec`). Do not develop here.
- **`production-v1`** — active development branch, pushed and in sync with `origin/production-v1` through Sprint 4 (commit `0550cdb`). This documentation-refresh update is local-only as of this writing — not yet pushed.
- **GitHub:** `github.com/davidcachan11-coder/morel-os`
- **Vercel production:** `morel-os.vercel.app`, deployed from `main` (i.e. currently still serving the frozen demo state, not `production-v1`'s in-progress foundation work).

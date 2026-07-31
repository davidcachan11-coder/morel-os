# Project Status

**Last updated:** 2026-07-30
**Current branch:** `production-v1`
**Last completed sprint:** Sprint 1.5 – Project Documentation & Standards (this commit, following Sprint 1 – Project Foundation, commit `a9db641`)
**Frozen demo reference:** git tag `demo-v1` (commit `22af3ec`, also `main`) — see `docs/DECISIONS.md`

This document is a snapshot, not a history — see `CHANGELOG.md` for the
chronological record and `docs/DECISIONS.md` for the reasoning behind past
choices.

## Summary

Morel OS is past the "sales demo" phase and into "production foundation"
work. The demo itself — landing page, storefront, checkout, live tracking,
and an ops dashboard — is feature-complete, fully mocked (no backend), and
frozen forever at the `demo-v1` tag. Active development happens on
`production-v1`, which has so far completed two non-visible foundation
sprints — architecture (Sprint 1) and documentation (Sprint 1.5) — before
any new user-facing features are built.

## Completed Modules

| Module | Route(s) | Status | Notes |
|---|---|---|---|
| Landing page | `/` | ✅ Complete | Hero, feature highlights, animated product mockup, CTA |
| Storefront | `/tienda` | ✅ Complete | 43-product catalog, search, category filters |
| Cart | (global, drawer) | ✅ Complete | Persisted via Zustand, per-item substitution preference |
| Checkout | `/tienda/checkout` | ✅ Complete | 4-step wizard: substitutions → delivery slot → mock payment → confirmation |
| Live order tracking | `/pedido/[id]` | ✅ Complete | Animated timeline, illustrated live map, toast notifications, wall-clock-simulated status |
| Ops dashboard (v0) | `/admin` | ✅ Complete, no auth | KPI cards, weekly sales chart, kanban board — see `docs/DASHBOARD_SPEC.md` for the full planned dashboard suite this is the first module of |
| Project Foundation (Sprint 1) | — | ✅ Complete | `config/`, `constants/`, `data/`, `hooks/`, `providers/`, `services/`, `types/` folders established; `lib/mock-data.ts` split by domain; zero functional change |
| Documentation (Sprint 1.5) | — | ✅ Complete (this sprint) | This file and the rest of `docs/`, plus root-level `PRODUCT_VISION.md`, `CONTRIBUTING.md`, `CHANGELOG.md` |

## Pending Modules

Nothing below has been started unless noted. Ordered roughly by what's
likely to unblock the most other work — see `docs/ROADMAP.md` for milestone
grouping and `docs/DASHBOARD_SPEC.md` for the dashboard-specific backlog.

- **Real backend / API layer** — no `app/api/`, no database, no data-fetching library. Everything is static mock data or `localStorage`.
- **Authentication** — no login, no sessions, no user accounts anywhere, including `/admin`, which is currently public.
- **Real payments** — the checkout payment step is explicitly cosmetic ("Pago simulado"); no PCI-compliant provider is integrated.
- **Testing** — no test runner installed, no test files exist.
- **CI** — no GitHub Actions or equivalent; `build`/`lint` are run manually.
- **Security headers** — `next.config.ts` is unmodified from the `create-next-app` default; no CSP/`X-Frame-Options`/etc.
- **Accessibility hardening** — checkout payment step isn't a real `<form>` (no Enter-to-submit, no `autoComplete` hints); delivery-slot/category pickers aren't exposed as ARIA single-select groups.
- **Config adoption** — `config/brand.ts`, `theme.ts`, `navigation.ts`, `features.ts`, `seo.ts` are populated but not yet consumed by any component (see `docs/ARCHITECTURE.md` §7).
- **Remaining dashboard modules** — Executive, Inventory, Customers, Marketing, Finance, Employees, and AI Operations Center are all specced in `docs/DASHBOARD_SPEC.md` but not built; only Operations (v0) exists.

## Branch & Deployment State

- **`main`** — identical to the frozen demo (`demo-v1` tag, commit `22af3ec`). Do not develop here.
- **`production-v1`** — active development branch, currently 2 commits ahead of `origin/production-v1` (Sprint 1, `a9db641`, and Sprint 1.5, both not yet pushed as of this writing).
- **GitHub:** `github.com/davidcachan11-coder/morel-os`
- **Vercel production:** `morel-os.vercel.app`, deployed from `main` (i.e. currently still serving the frozen demo state, not `production-v1`'s in-progress foundation work).

# Changelog

All notable changes to Morel OS are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [Semantic Versioning](https://semver.org/) — while
the project is pre-1.0 (`0.x.y`), minor bumps may include breaking
internal restructuring, and patch bumps are used for non-functional
changes (documentation, internal reorganization) as well as fixes.

## [Unreleased]

Nothing pending beyond what's tracked in `docs/ROADMAP.md`.

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

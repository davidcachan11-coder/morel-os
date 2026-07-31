# Changelog

All notable changes to Morel OS are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [Semantic Versioning](https://semver.org/) — while
the project is pre-1.0 (`0.x.y`), minor bumps may include breaking
internal restructuring, and patch bumps are used for non-functional
changes (documentation, internal reorganization) as well as fixes.

## [Unreleased]

Nothing pending beyond what's tracked in `docs/ROADMAP.md`.

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

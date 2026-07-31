# Architectural Decisions

This is a running log of significant decisions made on this project, in the
spirit of a lightweight ADR (Architecture Decision Record). Each entry says
what was decided, why, and what it trades off. Add a new entry whenever a
decision is made that a future contributor would otherwise have to
reverse-engineer from the code.

---

## 2026-07-30 — Next.js 16 App Router, TypeScript strict, Tailwind v4

**Decision:** Build on Next.js 16 (App Router, Turbopack), React 19,
TypeScript with `strict: true`, and Tailwind CSS v4 using its CSS-first
config (`@theme inline` in `app/globals.css`, no `tailwind.config.ts`).

**Why:** This is the current, actively maintained stack with the best
first-party support for the patterns this app needs (Server/Client
Component composition, per-route code splitting, dynamic route params).
`strict: true` was chosen over a looser config because the domain has
enough real structure (products, orders, delivery slots) that type safety
pays for itself immediately, not just at scale.

**Trade-off:** Next.js 16 is new enough that some API shapes (notably
`params` as a `Promise` in dynamic routes) differ from older Next.js
knowledge and documentation. This is a one-time cost, paid once, not an
ongoing one.

---

## 2026-07-30 — No backend; everything is mocked client-side

**Decision:** The application has no database, no API routes, and no
external services. All product/order/delivery data lives in `data/*.ts`
(static, typed) and `localStorage` (via `lib/cart-store.ts` and
`services/orders.ts`).

**Why:** The initial build target was a client-facing sales demo that
needed to deploy with zero configuration and no external dependencies (no
API keys, no database provisioning, nothing that could fail during a live
pitch). A fully client-side app guarantees it works identically every time
it's opened, with no network dependency beyond the static asset CDN.

**Trade-off:** This is explicitly a phase, not a permanent architecture.
See "Future Architecture Vision" in `docs/ARCHITECTURE.md` for how each
piece (`services/`, `hooks/use-order-progress.ts`, `/admin`) is expected to
change when a real backend is introduced. Building the folder structure to
anticipate this (Sprint 1) was itself a decision — see below.

---

## 2026-07-30 — Zustand (not Context, not Redux) for cart state

**Decision:** Use Zustand with the `persist` middleware for the shopping
cart, rather than React Context or a heavier state library.

**Why:** The cart needs to be (a) global across routes, (b) reactive, and
(c) persisted across page reloads/tab closes without extra plumbing.
Zustand's `persist` middleware does all three with a few lines of
configuration and no Provider component to wire into the tree. Context
alone would require manually implementing persistence; Redux/RTK would be
substantial ceremony for a single, simple slice of state.

**Trade-off:** Introduces a second, differently-shaped persistence pattern
alongside `services/orders.ts`'s hand-rolled `localStorage` reads/writes —
flagged as a known inconsistency to resolve in a future sprint (a shared
repository-style interface behind both), not fixed yet because doing so
now would be a functional refactor, which is out of scope for a
foundation/documentation sprint.

---

## 2026-07-30 — Wall-clock-derived order status instead of a stored status field

**Decision:** `/pedido/[id]`'s order status (`Confirmado` → `Preparando` →
`Control de calidad` → `En camino` → `Entregado`) is not a stored field
anywhere. `hooks/use-order-progress.ts` derives it every second from
`Date.now() - order.createdAt`, against a fixed set of stage-timing
constants.

**Why:** This makes the tracking page **self-resuming**: refresh the page,
close and reopen the tab, or open the same order link five minutes later,
and the status is always correct without any server pushing updates or any
client-side timer needing to be re-synchronized. For a live sales demo,
this reliability mattered more than architectural purity.

**Trade-off:** This is fundamentally incompatible with a real backend that
pushes real status changes. It is documented in `docs/ARCHITECTURE.md` as
something to be **replaced, not extended** — no future feature should be
built assuming this timer is permanent.

---

## 2026-07-30 — Emoji + CSS gradients instead of product photography

**Decision:** Every product, category, and decorative "visual" in the app
(product cards, cart items, the live map's store/home pins) uses an emoji
on a CSS gradient background, never a photograph or external image.

**Why:** Three reasons together: (1) zero external dependencies — no image
hosting, no risk of a broken/slow image load during a live meeting; (2) it
reads as a deliberate, cohesive design choice rather than placeholder
content, at the polish level targeted (Linear/Instacart-adjacent); (3) it
sidesteps sourcing/licensing real product photography entirely.

**Trade-off:** Won't scale to a "real" storefront where customers expect
to see the actual product. This is an acceptable demo-phase trade, to be
revisited when real product photography/CDN integration is in scope.

---

## 2026-07-30 — No dark mode

**Decision:** The app is light-mode only. `@custom-variant dark` and a
`next-themes`-driven `Toaster` exist in the codebase (inherited from the
shadcn/ui scaffold) but are never wired to an actual `ThemeProvider` —
there is no dark theme to toggle to.

**Why:** Explicit scope decision for the initial build: design polish time
was spent on one mode done well rather than two modes done adequately.

**Trade-off:** The inert `next-themes`/`dark` scaffolding is dead weight
that should eventually be either wired up properly or removed — flagged,
not yet acted on, since removing it is a code change outside this sprint's
scope.

---

## 2026-07-30 — Freeze the demo (`demo-v1` tag) before starting production work

**Decision:** Before any production-oriented work began, the exact commit
shown in the client sales meeting was tagged `demo-v1` and preserved on
`main`. All new development moved to a new branch, `production-v1`.

**Why:** The demo is a real deliverable that must remain reproducible
forever — for reference, for a possible re-pitch, or simply as a known-good
baseline to diff against. Tagging plus a dedicated `main` (frozen) /
`production-v1` (active) branch split makes "what did the client see"
an unambiguous, permanent answer, independent of whatever happens next.

**Trade-off:** None meaningful — this is a low-cost, high-value safety
practice. The only discipline it requires is: **never commit new work
directly to `main`.**

---

## 2026-07-30 — Sprint 1: introduce `config/`, `constants/`, `data/`, `hooks/`, `providers/`, `services/`, `types/`

**Decision:** Split the single `lib/mock-data.ts` (338 lines, six unrelated
domains) into `data/catalog.ts`, `data/delivery.ts`, `data/orders.ts`,
`data/admin.ts`. Relocate `lib/orders.ts` → `services/orders.ts` and
`lib/use-order-progress.ts` → `hooks/use-order-progress.ts`. Introduce
`config/` (structured app configuration) and `constants/` (primitive
literals, e.g. the delivery fee and `localStorage` key names, each
previously duplicated in two places). Scaffold empty `providers/` and
`types/` for future use rather than inventing speculative content for them.

**Why:** An architectural audit of the demo-complete codebase (see the
audit performed ahead of this sprint) found: a monolithic data file mixing
unrelated domains, a `hooks/` alias already declared in `components.json`
pointing at a folder that didn't exist, one custom hook and one
`localStorage`-backed module sitting in a catch-all `lib/` instead of
where their names say they belong, and two independently-duplicated
literal values (delivery fee, storage keys). This sprint fixed exactly
those findings — nothing more — with zero visible or functional change,
verified by a full manual walkthrough (cart, checkout, tracking, admin)
plus `npm run build` / `npm run lint` both passing clean before and after.

**Trade-off:** `providers/` and `types/` remain empty scaffolding — a
deliberate choice to avoid inventing structure ahead of a real need. This
is intentional, not an oversight; see `docs/ARCHITECTURE.md` §8 for what's
expected to land in each once there's a concrete reason.

---

## 2026-07-30 — Sprint 1.5: formal documentation before further feature work

**Decision:** Before any new features are built on `production-v1`, create
a full documentation set (`docs/ARCHITECTURE.md`, `docs/PROJECT_STATUS.md`,
this file, `docs/ROADMAP.md`, `docs/DASHBOARD_SPEC.md`,
`PRODUCT_VISION.md`, `CONTRIBUTING.md`, `CHANGELOG.md`) as its own,
documentation-only sprint.

**Why:** The project moved from "one person building a demo fast" to
"a codebase other people (and future sessions) need to understand without
re-deriving context." Writing this down now, while the reasoning is fresh,
is far cheaper than reconstructing it later from git history and code
alone.

**Trade-off:** None — this sprint intentionally touches zero application
code.

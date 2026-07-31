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

---

## 2026-07-31 — Sprint 2: backend architecture designed, re-scoped to the Dominican Republic

**Decision:** Design (not implement) the full backend: tRPC + Next.js
Route Handlers, PostgreSQL on Neon, Prisma, Auth.js, Inngest, Upstash
Redis, Vercel Blob → Cloudflare R2, Sentry — recorded in
`docs/BACKEND_ARCHITECTURE.md`, with every major choice carrying a full
problem/options/advantages/disadvantages/security/scalability/cost/
lock-in/migration-difficulty/"if this is wrong" analysis, not just a
recommendation. Mid-sprint, the target market was explicitly re-scoped
from the Argentina/LatAm assumptions baked into the demo
(`PRODUCT_VISION.md`, `data/*.ts`) to the **Dominican Republic** —
replacing Mercado Pago/Stripe with Azul (primary) + CardNet (secondary)
+ Cash on Delivery, ARS with DOP, adding DGII/ITBIS fiscal-receipt
modeling, restructuring the address model around DR's
province/municipality/landmark-based reality, and making WhatsApp
(not SMS) the primary notification channel.

**Why:** A backend of this scope — real money, real customer PII, real
regulatory (fiscal) requirements — needed every major decision reasoned
through and recorded *before* implementation, not discovered mid-build.
The market re-scope happened because the backend is what will actually
process real transactions for a real business, and Stripe does not
support Dominican Republic–domiciled merchant accounts while Mercado
Pago has no meaningful DR presence — continuing to design against
Argentina's payment landscape would have produced an architecture that
couldn't actually be implemented for its real target market.

**Trade-off:** `PRODUCT_VISION.md`, `docs/DASHBOARD_SPEC.md`, and the
current mock data (`data/*.ts`) still describe the Argentine demo and were
**not** updated to match — `docs/BACKEND_ARCHITECTURE.md` flags this
mismatch explicitly rather than silently carrying it. It must be
reconciled (either update the product docs to the DR, or keep the
backend's *patterns* market-agnostic while only its market-specific
sections are DR-specific) before real implementation reaches the
customer-facing product surface, though it does not block backend
foundation work (Sprint 3).

---

## 2026-07-31 — Sprint 2: permanent engineering standards established, independently reviewed

**Decision:** Alongside the backend design, create three permanent,
binding standards documents — `docs/SECURITY_ARCHITECTURE.md`,
`docs/INFRASTRUCTURE_ARCHITECTURE.md`, `docs/ENGINEERING_STANDARDS.md` —
distinct from `docs/BACKEND_ARCHITECTURE.md`'s design-analysis style:
these use MUST/SHOULD language and are meant to outlive any individual
technology choice in the backend design. The full four-document set was
then subjected to an independent architecture review (internal
consistency, completeness, security, infrastructure, standards
enforceability, implementation readiness) before being treated as
approved.

**Why:** A one-time design document answers "what did we decide and why."
A standing standard answers "what must every future change continue to
satisfy" — these are different documents with different lifetimes, and
conflating them would mean either the design rationale gets diluted by
prescriptive rules, or the binding rules get lost inside a much longer
analytical document. The independent review pass existed specifically to
catch the kind of drift/gap that's easy to introduce when four documents
are written across several sessions — it found and the team fixed four
High-severity issues (two broken internal cross-references, a
same-content duplication risk between `docs/BACKEND_ARCHITECTURE.md` §16
and `docs/SECURITY_ARCHITECTURE.md`, a missing CI-before-Phase-1
sequencing requirement, and an undefined first-admin bootstrap mechanism)
before approval.

**Trade-off:** Four architecture/standards documents (plus this file,
`docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md`) is a
real maintenance surface — every future decision now has more places it
could need to be reflected. This is accepted deliberately, consistent
with `docs/BACKEND_ARCHITECTURE.md` §23's "Documentation First" principle;
the alternative (under-documenting a system that will hold real payment
and customer data) is the worse trade.

---

## 2026-07-31 — Sprint 3 Phase 1 seed data: placeholder values for DR-only fields absent from the mock data

**Decision:** `prisma/seed.ts` implements the full Dominican Republic schema
from day one (see the schema-scope decision below) and seeds it from
`data/catalog.ts`, `data/delivery.ts`, `data/orders.ts`, and
`data/admin.ts`, preserved verbatim wherever their shape already matches
the schema. For schema fields that are required but have no equivalent
in the current (still Argentina-themed) mock data — e.g. a product's tax
category, an address's province/municipality — the seed script fills
them with explicit, clearly-marked placeholder values rather than
inventing fictional DR content or leaving the field null.

**Why:** `docs/BACKEND_ARCHITECTURE.md` §19 Phase 1 calls for seeding
"byte-identical" to today's mock data, but the mock data was written for
an Argentina-themed demo and genuinely does not carry DR-specific fields
the real schema needs. Redesigning the schema around the old dataset
would mean building the wrong long-term shape; silently inventing
realistic-looking DR content would risk that placeholder data being
mistaken for real product/address data later. Marked placeholders keep
the schema correct now and the gap visible and traceable.

**Trade-off:** The seeded database is not yet representative of real DR
catalog, pricing, or address data — every placeholder is commented
in-line, pointing back to this entry. A dedicated content migration (real
DR products, DOP pricing, real provinces/municipalities, real tax rates)
is required before any customer-facing or production use, and is
explicitly out of scope for Sprint 3.

---

## 2026-07-31 — Sprint 3 initial Prisma schema: Sprint 3/4 entities plus identity, not the full §3 entity set

**Decision:** `prisma/schema.prisma`'s first version models the entities
required to seed today's mock data (Sprint 3) and to support Sprint 4's
planned migration (`services/orders.ts` cutover to tRPC,
`hooks/use-order-progress.ts` replaced with real `OrderStatusEvent`
polling) — `Branch`, `Category`, `Product`, `Brand`, `Customer`,
`Address`, `DeliverySlot`, `Delivery`, `Driver`, `Order`, `OrderItem`,
`OrderStatusEvent` — **plus the complete identity schema**: `User`,
`Role`, `Account`, `Session`, `VerificationToken`. No authentication
logic, adapters, middleware, routes, or login flows are implemented
against these identity tables until Sprint 5 — Sprint 3 establishes the
schema only. Payments/finance (`Payment`, `Refund`), fiscal
(`TaxCategory`, `FiscalReceipt`), marketing (`Campaign`, `Promotion`,
`CouponRedemption`), employees (`Employee`, `Shift`), `NotificationLog`,
`AuditLog`, and `AIInsight` remain deferred — added in the schema
revision for the sprint that actually implements each (Sprint 6 for
payments/fiscal, Sprint 9+ for marketing/employees/AI).

**Why:** All of these entities are already specified in
`docs/BACKEND_ARCHITECTURE.md` §3, so nothing here contradicts the frozen
architecture — this is a sequencing choice, not a design change. The
identity model is included now (rather than deferred to Sprint 5 with
the rest) specifically to avoid a second, disruptive schema migration
once Auth.js implementation begins — the tables are small, fully
specified, and untouched by any other Sprint 3/4 work, so including them
adds no meaningful migration complexity. The remaining deferred groups
(payments/fiscal, marketing, employees, notifications, audit log, AI)
are excluded because building every model from §3 on day one would carry
migration and review surface for tables nothing in Sprint 3 or Sprint 4
reads or writes, several sprints before they're needed.

**Trade-off:** Each later sprint that introduces a still-deferred entity
group (Sprint 6 payments/fiscal, Sprint 9+ marketing/employees/AI) will
need its own migration and its own schema-scope PR. The identity tables,
by contrast, exist unused for two sprints (Sprint 3 and 4) before Sprint
5 builds real behavior on top of them — accepted because the alternative
(adding them only in Sprint 5) would mean Auth.js implementation and
schema migration landing in the same sprint, a larger combined change
than authenticating against an already-existing, already-reviewed shape.

---

## 2026-07-31 — Sprint 3 database provisioning: standalone Neon account, not the Vercel–Neon marketplace integration

**Decision:** Provision Neon as a standalone account/project, wiring
`DATABASE_URL` and `DIRECT_URL` into Vercel manually per environment,
rather than using Vercel's native Neon marketplace integration.

**Why:** `docs/BACKEND_ARCHITECTURE.md` §1.3 recommends Neon specifically
for vendor independence from the hosting platform. A standalone account
keeps the database relationship fully separate from the Vercel project,
at the cost of one-time manual environment-variable wiring instead of
the marketplace integration's automatic sync.

**Trade-off:** Preview-branch-per-PR automation and environment variable
propagation must be configured and verified by hand for each environment
(development, preview, production) rather than inherited for free from
the marketplace integration. This is accepted as a one-time setup cost in
exchange for not coupling the database provider to the hosting provider.

---

## 2026-07-31 — Sprint 3 deploy target: Preview Deployments only for `production-v1`; `main` remains production

**Decision:** Sprint 3 configures Vercel Preview Deployments for
`production-v1` and all PRs opened against it. The existing production
deployment (`morel-os.vercel.app`, deployed from `main`) is left
untouched — it continues serving the frozen demo (`demo-v1`).

**Why:** Sprint 3 lands backend infrastructure that is not yet wired to
any component or user-visible flow (per `docs/BACKEND_ARCHITECTURE.md`
§19 Phase 2, this is deliberate). There is no functional reason to cut
production over before a real feature depends on it, and doing so would
risk exposing infrastructure-in-progress (an unauthenticated Prisma-backed
API surface, however unused) on the domain real users could reach.

**Trade-off:** `production-v1`'s work stays unverified against the actual
production domain/environment until an explicit, separate cutover
decision is made — deferred to whichever sprint first ships something
production needs to actually serve. Until then, verification happens via
Preview Deployments and local development only.

---

## 2026-07-31 — Sprint 3 CI: scoped `npm audit` exceptions for 5 currently-unreachable, non-breaking-fix-unavailable advisories

**Decision:** The CI audit gate (`.github/workflows/ci.yml`, enforced by
`.github/scripts/check-npm-audit.mjs`) runs `npm audit --audit-level=high`
exactly as before — the threshold is not lowered and the step is not
skipped or disabled. The build fails on any high/critical advisory except
five specific ones, allowlisted primarily by their public **GHSA ID**
(matched against the advisory URL `npm audit --json` reports for each
finding). npm's internal numeric advisory `source` ID is kept only as a
documented fallback in the script, used solely if a future advisory's URL
doesn't expose a parseable GHSA ID — that fallback path prints a warning
rather than matching silently, so it can't mask a mismatch. The five
allowed advisories, GHSA ID first:

- GHSA-mh99-v99m-4gvg (npm source `1124334`) — `brace-expansion` (DoS via
  unbounded expansion length)
- GHSA-qx2v-qp2m-jg93 (npm source `1117015`) — `postcss` (XSS via
  unescaped `</style>` in stringify output; moderate severity in
  isolation, reached via a package this audit flags as high overall)
- GHSA-6g55-p6wh-862q (npm source `1124252`) — `postcss` (arbitrary file
  read via attacker-controlled `sourceMappingURL`)
- GHSA-r28c-9q8g-f849 (npm source `1124288`) — `postcss` (path traversal
  via `sourceMappingURL` leading to arbitrary `.map` file disclosure)
- GHSA-f88m-g3jw-g9cj (npm source `1124066`) — `sharp` (inherited libvips
  CVEs: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591)

This allowlists these five specific advisory records only, not the
packages that carry them. A new advisory on `brace-expansion`, `postcss`,
or `sharp` tomorrow — or on any other package — carries a different GHSA
ID and fails the build exactly as it would without this mechanism. GHSA
IDs were chosen as the primary key over npm's internal `source` numbers
because they're public, stable across npm's own database changes, and
match what this entry (and the script's own comments) are written
against — reducing the risk that a future npm database renumbering
silently widens or breaks the allowlist.

**Why each is currently unreachable, and why no non-breaking fix exists:**

`brace-expansion` reaches the app only through ESLint's `minimatch` →
`@eslint/config-array`/`@eslint/eslintrc` chain, itself pulled in by the
direct `eslint` and `eslint-config-next` devDependencies. It is exercised
solely against developer-authored lint-config glob patterns at lint time
— never against external or user-supplied input, and never present in
the built application. Its only fix path is `eslint@10.x`, a semver-major
version bump carrying real risk of lint-rule/config breakage; evaluating
that upgrade is out of scope for a CI-stand-up PR and would be its own
future change.

`postcss`'s three advisories all live in Next.js's *private* nested copy
(`next/node_modules/postcss@8.4.31`) — the project's own top-level
`postcss@8.5.25`, used by Tailwind via `@tailwindcss/postcss`, is already
patched and unaffected; confirmed by comparing both installed versions
directly. All three require attacker-controlled CSS source content (a
malicious stylesheet or an embedded comment) to trigger the file-read,
path-traversal, or stringify-XSS behavior. This app has no user-submitted
or externally-sourced CSS — every stylesheet is developer-authored and
compiled at build time, so the trigger condition doesn't exist here. No
independent upgrade path exists either: this is Next's own internal
dependency, not something `npm install postcss@latest` reaches. A
`package.json` `overrides` entry could force a newer version, but that
would run Next's internal build pipeline against a `postcss` release it
was never tested with — a nominal "non-breaking" fix that is in practice
an unverified change to Next's own internals.

`sharp` is nested at `next/node_modules/sharp@0.34.5` and powers
`next/image`'s server-side optimization endpoint. A full grep of `app/`,
`components/`, `lib/`, and `hooks/` confirms `next/image` is not imported
anywhere in this codebase — consistent with the existing decision (see
"Emoji + CSS gradients instead of product photography" above) to use
emoji and CSS gradients rather than real images. The vulnerable code path
isn't merely low-risk here, it is never executed. The same nested-
dependency constraint on independent upgrades applies as with `postcss`.

**Trade-off:** These five findings stay suppressed only until whichever
of the following happens first — at that point this entry must be
revisited (narrowed, removed, or superseded by a new dated entry, never
silently extended):

1. Next.js ships a release bumping its internal nested `postcss` and/or
   `sharp` past the patched versions (`postcss` > 8.5.17, `sharp` >=
   0.35.0) — re-run `npm audit` after any Next.js version bump to check.
2. `eslint`/`eslint-config-next` are deliberately upgraded past their
   current major versions, evaluated as its own separate change.
3. `next/image` (or any other code path that would invoke `sharp`) is
   introduced anywhere in the app — `sharp`'s exception must be
   re-evaluated immediately, before merge, not after the fact.
4. Any of these five advisory records themselves change scope (a broader
   exploit vector, a reassessed severity) — `npm audit` evaluates each
   advisory's current state fresh on every run regardless of this
   allowlist, so a materially different advisory would need this entry's
   reasoning re-checked against the update.

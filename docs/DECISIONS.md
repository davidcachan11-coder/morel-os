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

---

## 2026-07-31 — Order tracking identifiers must not be enumerable before Sprint 4 wires real checkout

**Decision:** `Order.id` will not be the "MO-" + small-numeric-range format
`services/orders.ts`'s `generateOrderId()` currently produces (~10,000
possible values — trivially enumerable, confirmed during PR 6's review of
the read-only `ordersRouter`). Before Sprint 4 cuts `services/orders.ts`
over to write real rows into a shared, network-reachable `Order` table,
the order's actual identifier must be switched to an opaque,
non-enumerable value (a CUID/UUID), with a separate, non-secret
`orderNumber` field retained for customer-facing/support display
(e.g., "MO-73042") — the identifier a human reads or quotes to support
carries no access-granting power of its own.

**Why:** The same small-keyspace id format was harmless while orders only
ever lived in per-browser `localStorage` (pre-Sprint-3) — guessing a valid
id got an attacker nothing, since storage was per-browser with no
cross-user reachability. Sprint 3 moved `Order` into a shared Postgres
database (`SECURITY_ARCHITECTURE.md` classifies `Order` as Confidential),
and PR 6 added a public, unauthenticated `getOrder(id)` procedure matching
the app's existing `/pedido/[id]` tracking-link behavior — at that point,
the same id format became a real enumeration vector reachable by anyone
over the network, not just a cosmetic legacy quirk. This was evaluated
against three options (opaque id + friendly number; dedicated,
expiring/revocable tracking tokens; requiring authenticated ownership) —
full comparison on security, customer experience, support workflow,
migration impact, and future marketplace compatibility is preserved
alongside this entry. Opaque identifiers were chosen because they fully
close the enumeration hole with no product/UX change and no dependency on
Sprint 5's auth work, while not precluding either of the other two options
being layered on later as additional hardening.

**Trade-off:** Opaque identifiers alone do not prevent a leaked tracking
link from being viewed by someone it wasn't intended for — bearer-link
semantics are unchanged, just no longer brute-forceable. Revisiting
dedicated tracking tokens (expiring/revocable) or requiring authenticated
ownership is deferred to Sprint 5+, once real Auth.js session
infrastructure exists and real order volume/PII exposure makes that
additional hardening non-hypothetical — not ruled out, just not
justified as a Sprint 3/4 cost today.

---

## 2026-07-31 — `ordersRouter.saveOrder` stays in Sprint 3; guest checkout, customer resolution, and the order-id fix land together

**Decision:** The above entry's "before Sprint 4" framing is superseded, not
retracted: on review, the reason originally given for deferring
`saveOrder` to Sprint 4 (the enumerable-id coupling) didn't actually hold
up — a `saveOrder` procedure just persists whatever `id` it's given, it
doesn't decide the format. The real blocker was a different, previously
unnamed one: `Order.customerId`/`Customer.userId` are required foreign
keys, and today's checkout (`app/tienda/checkout/page.tsx`) hardcodes
`customerName: "Camila Ferreyra"` with no real identity capture at all —
there was no legitimate way to resolve a `Customer` for an anonymous
checkout. `saveOrder` stays in Sprint 3; that identity question is
resolved instead, and the order-id/`orderNumber` schema change from the
entry above ships as part of this work, not Sprint 4.

**Guest checkout — customer identity:**
- Every checkout collects **name, email, and phone** (a business
  requirement, not just a technical convenience) and auto-creates a
  `User` (role `CUSTOMER`) + `Customer` — no login required, matching the
  app's actual current checkout experience.
- **Resolution is keyed on email only.** Email is the sole database-
  enforced-unique signal (`User.email @unique`); an existing `User` found
  by email is unambiguously the same account. Phone is captured and
  stored but is **never** a merge key — a shared/family phone number is a
  plausible benign explanation for a match, and merging identity on it
  risks attaching one person's order history to someone else. If a
  checkout's phone matches an existing, *different* email's account, that
  is logged as a `possible_duplicate_customer` signal (structured, with
  the request's correlation id) for future reconciliation tooling — never
  auto-merged. True de-duplication across two different emails belonging
  to the same real person requires proof of ownership, which doesn't
  exist before Sprint 5.
- **Returning customers (matched by email) never have their stored
  `name`/`phone` overwritten** by a fresh checkout submission. An
  unauthenticated submission is not proof of account ownership; silently
  allowing it to overwrite existing data is an integrity risk (accidental
  typo or deliberate tampering), not a freshness trade-off worth taking.
  A verified update path is Sprint 5's authenticated profile-edit, not
  this procedure. Implemented as an atomic `prisma.user.upsert` keyed on
  email with an empty `update: {}` — race-safe by construction, not a
  manual find-then-create with its own concurrency risk.
- Explicitly rejected: matching on email *or* phone (real false-merge
  risk — two different people can share a phone); always overwriting
  name/phone on repeat checkout (the integrity risk above); nullable
  `Order.customerId` with orders linked to a `Customer` later (would
  reverse the already-shipped, already-migrated required-FK schema from
  PR 2, and requires building a "claim my orders" feature nothing in this
  product currently needs); requiring authentication for all checkout
  (correct long-term, but can't deliver a working `saveOrder` before
  Sprint 5, and this product has never indicated "account required to
  buy groceries" as the intended experience).

**Branch — discovered from the database, not an assignment service:**
Morel operates one physical location (Mao) today. `Branch` gains an
`isDefault: Boolean` column (matching the existing `Address.isDefault`
convention in this same schema), and `saveOrder` queries
`findFirst({ where: { isDefault: true } })` — no selection algorithm, no
geocoding, no branch-assignment logic, no environment configuration to
keep in sync. This was chosen over an env-var-based
`DEFAULT_BRANCH_ID` (the originally implemented approach) because it
doesn't survive this project's own already-decided infrastructure:
Neon's branch-per-PR preview databases (`INFRASTRUCTURE_ARCHITECTURE.md`
§6) generate a fresh, random `Branch.id` on every seed run, so an env var
would need to be correctly re-set for every ephemeral preview
environment — impractical at any real PR volume, and nothing this
project's Vercel/Neon setup automates today. A partial unique index
(`CREATE UNIQUE INDEX ... ON "Branch" ("isDefault") WHERE "isDefault" =
true`, hand-authored in this migration since Prisma's schema DSL has no
partial-index syntax) guarantees at most one row is ever the default;
`saveOrder` fails loudly (`INTERNAL_SERVER_ERROR`, "no branch is marked
as default") if none is. `branchId` is not part of `saveOrder`'s
client-facing input at all, since there is currently no decision for a
client to express. When Morel expands to multiple branches, a dedicated
Branch Assignment Service becomes a separate, later architectural
evolution that resolves a `branchId` and hands it to `saveOrder`
unchanged — `saveOrder`'s responsibility stays exactly "retrieve the
default branch, validate it exists," then and now.

**`orderNumber` generation — a standalone sequence, not a Prisma field:**
`order_number_seq` is created directly in this migration
(`CREATE SEQUENCE`), deliberately *not* a Prisma model field (the
originally implemented approach used `Order.orderSeq Int
@default(autoincrement())`). A sequence tied to a selectable column
appears in every generated `Order` TypeScript type — one unguarded
`findMany()` without an explicit `select` away from returning a
monotonically increasing counter that directly reveals order volume and,
by comparing two rows' values, order rate — exactly the kind of internal
business metric `SECURITY_ARCHITECTURE.md`'s data classification treats
as sensitive. A schema-invisible sequence makes that leak structurally
impossible rather than relying on every future query remembering to
exclude one field. `saveOrder` references it directly by name
(`nextval('order_number_seq')`) before its single `order.create()` call,
same as before — the only change is that the sequence is no longer
attached to any column.

**Schema fields evaluated and explicitly not added, with why:**
- `isGuest` (or similar) — not needed, likely never as a stored field.
  Whether a `Customer` is a guest is already fully derivable from whether
  their linked `User` has any `Account` rows (a real Auth.js sign-in). A
  redundant flag could drift from this; the derived definition cannot.
- `emailVerified`/`phoneVerified` — Sprint 5. No verification mechanism
  (OTP, confirmation link) exists yet; collecting a field isn't the same
  as verifying it, and the field would be uniformly meaningless on every
  row created today.
- Marketing consent, CRM/lifecycle fields — Sprint 9+ (Marketing). No UI
  asks the question yet; nothing is lost by adding these when it does.
- `User.phone` uniqueness/format validation — not now. SMS/WhatsApp
  passwordless auth was explicitly framed as a future maybe, not a
  decision; adding a constraint now would mean guessing at requirements
  that don't exist.
- `User.name`/`User.phone` stay nullable at the schema level — the
  business rule is enforced as required `saveOrder` Zod inputs, not a
  blanket table constraint, since `User` is shared across `CUSTOMER`,
  `DRIVER`, and staff roles whose account-creation flows (and data-
  capture rules) aren't designed yet.

**Why (overall):** Every alternative considered either reversed schema
work already shipped, built a feature (claim flow, branch assignment
service) nothing currently needs, or couldn't produce a working
`saveOrder` before Sprint 5 — none of which was necessary once the actual
blocker (customer identity, not id format) was correctly identified.

**Trade-off:** Guest checkouts accumulate `User`/`Customer` rows that may
never be claimed by a real account — accepted, since email-keyed
resolution means a returning guest reuses the same row rather than
multiplying, and Sprint 5's Auth.js account-linking (matching by email)
attaches real login to this same row with no migration needed. Auth.js's
default adapter does not auto-link a new OAuth sign-in to an existing
User with the same email without explicit configuration
(`allowDangerousEmailAccountLinking`) or a confirmation flow — Sprint 5
must decide that explicitly, not inherit it silently from this design.

---

## 2026-07-31 — `saveOrder` idempotency is deferred to Sprint 4, deliberately — not a forgotten gap

**Decision:** `ordersRouter.saveOrder` does **not** implement request
idempotency in Sprint 3. Double-submission protection (a client-generated
idempotency key, checked against `Order` before creating a new row) is a
**required part of Sprint 4's checkout-cutover work** — the same PR that
wires `services/orders.ts` to call `saveOrder` for real, not a separate,
optional follow-up. This entry exists specifically so that omission reads
as an intentional sequencing choice, not an oversight discovered later.

**Why deferred rather than built now:** Client-generated idempotency keys
(the correct, industry-standard mechanism — evaluated against request
fingerprinting and payment-provider-anchored identifiers, both rejected:
fingerprinting is heuristic/fuzzy where an explicit key is deterministic,
and no payment step exists yet to anchor to before Sprint 6) only work
correctly in concert with the client that generates and persists them —
when the key is created, whether it survives a page refresh, when it's
regenerated for a genuinely new order versus reused for a retry. None of
that exists yet. Sprint 3's `saveOrder` was scoped to mirror
`services/orders.ts`'s *existing* `saveOrder(order)` contract, which has
no idempotency concept at all; adding one now would mean designing half
of a two-sided mechanism (the server enforcement) against a client half
that doesn't exist, and verifying it against an assumption instead of
real behavior. This is the same reasoning already applied to branch
assignment (`saveOrder` receives and validates a branch, it doesn't
decide selection strategy, because there's no second branch yet to
motivate designing one) — applied here with the same rigor rather than
treated as a special case because implementation momentum already
existed. Sprint 4 is the first point where the actual checkout UI's
retry/refresh/double-submit behavior is knowable rather than guessed,
and it is also the first point `saveOrder` has any real caller at all —
so unlike a live contract with existing traffic, adding this requirement
in Sprint 4 costs nothing extra: the first caller is written from
scratch either way, in that sprint, regardless of whether the field
existed one sprint earlier.

**Why this isn't just "later, maybe":** Sprint 4 must implement, at
minimum: a required, client-supplied idempotency key on `saveOrder`'s
input (a UUID, per the client-generated-key pattern); an `Order`-level
unique column storing it; an early, first-step lookup inside the
transaction that returns an existing order's result unchanged if the key
was already used (before re-running branch/slot/product validation);
and a client-side strategy for generating and persisting the key across
the checkout session (e.g., alongside `lib/cart-store.ts`'s existing
persisted state) so a page refresh doesn't silently generate a new key
and defeat the mechanism. No expiry/TTL logic or background job is
needed — `Order` rows are permanent business records never deleted, so
the key's lifetime is correctly bound to its Order's lifetime with
nothing to clean up. The same key should be threaded through to Sprint
6's payment-authorization call once that exists, so one key protects
both the order row and the charge rather than two parallel mechanisms
being invented.

**Trade-off:** Between Sprint 4 shipping and this entry being written,
`saveOrder` remains vulnerable to duplicate orders from double-clicks or
client retries — accepted, because nothing calls `saveOrder` at all until
Sprint 4, so the exposure window is exactly zero in practice. The
alternative (building the mechanism speculatively now) would have traded
a real, if brief, gap for a real, ongoing risk of designing the wrong
contract against a client that doesn't exist yet.

---

## 2026-07-31 — Delivery-slot capacity management is deferred to Sprint 4, deliberately — not a forgotten gap

**Decision:** `ordersRouter.saveOrder` validates that a requested
`DeliverySlot` exists, but does not read, check, or decrement
`DeliverySlot.spotsLeft`. Nothing today prevents an order from being
placed against a slot already at zero remaining capacity, and no
contention handling exists for concurrent orders against the same slot.
Building this — an atomic decrement-with-check (e.g. a conditional
`UPDATE ... WHERE spotsLeft > 0`, detecting and rejecting a "sold out"
slot) plus deciding what that rejection returns to the client — is
**deferred to whichever sprint wires real delivery-slot selection into
the checkout UI (Sprint 4)**, not implemented now.

**Why deferred rather than built now:** Slot capacity enforcement is a
real, non-trivial feature with its own concurrency design (analogous in
weight to the idempotency-key and branch-assignment decisions above),
not a two-line addition to an existing check. It was never part of the
contract Sprint 3 was scoped to mirror: the current, existing checkout
(and `services/orders.ts`'s `StoredOrder`) never enforces slot capacity
either — the mock flow is cosmetic. Sprint 3's goal is to faithfully
mirror the existing infrastructure's behavior on real Postgres, not
redesign checkout behavior beyond what exists today. Capacity management
only becomes relevant once delivery slots are actually being consumed by
a real checkout flow selecting among genuinely limited slots — which is
Sprint 4's work, the same sprint already responsible for wiring
`saveOrder` into real checkout and adding request idempotency.

**Trade-off:** Between now and Sprint 4, a slot's displayed `spotsLeft`
/`totalSpots`/`capacity` values (already present in the seeded data and
returned by `deliveryRouter.listDeliverySlots`) are purely informational
— nothing enforces them. This is an accepted, zero-cost gap in practice:
nothing calls `saveOrder` with a real client before Sprint 4, so there is
no window in which a real customer could actually overbook a slot.

---

## 2026-07-31 — Sprint 4 client-side tRPC access: vanilla `@trpc/client` only, no TanStack Query

**Decision:** The client side of the tRPC cutover uses a single vanilla
proxy client (`createTRPCClient<AppRouter>`, `lib/trpc-client.ts`) with an
`httpLink` pointed at `/api/trpc`. No `@tanstack/react-query` or
`@trpc/tanstack-react-query` is added, and no `QueryClientProvider` is
introduced. `services/orders.ts`'s imperative functions call it directly;
`hooks/use-order-progress.ts`'s polling replacement calls it inside the
same `useEffect`/`setInterval` lifecycle the hook already has today (see
below), rather than switching to `useQuery({ refetchInterval })`.

**Why:** Compared against adding TanStack Query for the sake of the
polling hook. Rejected because Sprint 4 has exactly one read call site
(`getOrder`, via the tracker) and one write call site (`saveOrder`, via
checkout) — neither benefits from React Query's actual value proposition
(cache sharing/invalidation/dedup across *multiple* independent
consumers of the same query), and adding it now means standing up a
global provider (`providers/` has been deliberately empty since Sprint 1)
for a use case nothing in this sprint exercises. The vanilla client
satisfies both call sites' actual requirements — imperative async calls
from non-hook code, and interval-based refetching inside an existing
hook — with one new dependency instead of two, and no new provider tree.
If a later sprint adds a second, independent consumer that genuinely
needs shared caching (e.g. admin dashboard live KPIs), upgrading is a
contained, additive change — nothing built here needs to be undone to
get there.

---

## 2026-07-31 — `services/orders.ts` becomes a UI/tRPC adapter, not a persistence abstraction, in Sprint 4

**Decision:** When Sprint 4 cuts `services/orders.ts` over to call the real
`ordersRouter` (via a vanilla `@trpc/client` instance — see the client-
architecture note below), the module's responsibility changes from
"localStorage persistence" to a thin adapter between the UI's domain types
and the tRPC contract. Its exported functions (`saveOrder`, `getOrder`)
own request/response **mapping only**:

- UI/cart state → `saveOrderInput` (flattening `CartLine[]` into
  `items[]`; attaching the customer/address/slot fields collected in
  checkout).
- tRPC response → UI-facing order model (composing the confirmation view
  from the submitted cart data plus the server's
  `{id, orderNumber, createdAt}`, since `saveOrder` doesn't echo back
  items/address/total).
- Transport normalization only — e.g. `Prisma.Decimal` fields
  (`subtotal`/`deliveryFee`/`total`) arrive as strings (no `superjson` or
  other transformer is configured on `initTRPC` in `server/trpc/trpc.ts`),
  converted to numbers here.

It MUST NOT contain business rules, pricing computation, validation, or
persistence decisions — those stay server-side in `ordersRouter`.
`generateOrderId()` is removed entirely; order ids are now server-generated
opaque `cuid()`s.

**Why:** Evaluated against removing the module and having
`checkout/page.tsx`/`order-tracker-loader.tsx` call the tRPC client
directly. Rejected removal because the mapping above (cart→input,
response→confirmation view, Decimal→number) is real work this cutover
needs today, not a wrapper kept out of habit — removing the module would
relocate that logic into two components instead of centralizing it,
reintroducing the same "two independently-duplicated patterns" risk this
project already hit once (this file's `lib/cart-store.ts`/
`services/orders.ts` persistence-duplication entry, above). The old
justification for `services/` — protecting components from a hand-rolled
localStorage client swap — no longer applies once tRPC provides end-to-end
type safety directly; this entry replaces it with a narrower, current one.

**Trade-off / guardrail:** This draws the module's boundary narrower than
"everything to do with orders." If implementation reveals it accumulating
logic beyond pure mapping — re-deriving totals, re-validating input, retry
or caching policy — that's a signal to stop and flag it for review rather
than let the adapter grow into a second domain layer. `ordersRouter`
remains the single place business rules live.

---

## 2026-07-31 — `saveOrder` idempotency and delivery-slot capacity are now implemented (supersedes #19/#20's "deferred" framing)

**Decision:** The two gaps recorded above as deliberately deferred to
Sprint 4 — request idempotency and delivery-slot capacity enforcement —
are now implemented in `ordersRouter.saveOrder`, in the same PR since
both touch the same transaction:

- **Idempotency:** `saveOrderInput` gains a required `idempotencyKey`
  (`z.string().uuid()`); `Order` gains a required, unique
  `idempotencyKey` column. `prisma/seed.ts`'s 20 rows predate this
  procedure and never had a real client request behind them, so the
  seed script generates its own key per row (`node:crypto`'s
  `randomUUID()`) — an internal dedup token, not a business fact, so
  synthesizing one for seed data doesn't fabricate anything meaningful
  (no different in kind from the `cuid()` ids already synthesized for
  every seeded row). The migration backfills any pre-existing NULL rows
  with `gen_random_uuid()` before adding the `NOT NULL` constraint, so
  it applies safely regardless of whether the target database is a
  fresh, empty preview branch or already has seeded data. The
  transaction checks this key first, before any other work, and returns
  the original result unchanged on a repeat. A concurrent race on the
  same key is caught via the column's own unique constraint (P2002) —
  but deliberately *not* inside the transaction the way the email-upsert
  race above is. Once any statement inside a Postgres transaction fails,
  Postgres aborts that transaction at the session level; every later
  statement on the same connection fails too until a real `ROLLBACK`
  happens, and Prisma does not add savepoints around individual
  interactive-transaction calls to shield application code from this.
  So `order.create()`'s error is left to propagate out of
  `$transaction()` uncaught: Prisma performs a real rollback, which
  cleanly undoes the capacity decrement below (and this losing request's
  own email upsert, if it was a new customer) with no manual
  compensation needed, and the winning order is re-fetched with a fresh
  query (on `ctx.prisma`, not the now-dead `tx`) in the mutation's outer
  `catch`.
- **Capacity:** `saveOrder` now performs an atomic conditional decrement
  (`deliverySlot.updateMany` with `spotsLeft: { gt: 0 }`) immediately
  after the existing slot-existence check, throwing `CONFLICT` if the
  affected-row count is 0. This runs *after* the idempotency
  short-circuit, so a retried request never double-decrements.

**Why implemented together:** Both were deferred in the same two entries
above for the same reason (no real client existed to need them until
Sprint 4's checkout wiring), and both modify the same transaction in
`saveOrder` — reviewing them as one change is more coherent than two
PRs each partially editing the same function.

**Scope note:** Sprint 3's baseline — branch discovery, slot-existence
check, product lookup/Decimal math, the `order_number_seq` fetch,
`orderItem`/`orderStatusEvent` creation, and `getOrder` in its entirety —
is unchanged by this entry. No architectural decision from Sprint 3 was
revisited; this only adds the two features both #19 and #20 already
scoped for this exact sprint.

**Investigated, not fixed, in this entry:** Sprint 3's email-upsert race
handling (`tx.user.upsert` → catch P2002 → `tx.user.findUniqueOrThrow`
on the same `tx`) was suspected of having the same transaction-abort
issue reasoned through above, so it was empirically tested — a minimal
SQLite-backed Prisma project reproducing the exact `User`/`Customer`
nested-write shape, with query logging, both inside and outside an
interactive transaction. Findings:

- A plain `upsert()` with no nested write never throws for this race at
  all — it's resolved atomically at the database level and silently
  returns the existing row.
- `upsert()` *with* a nested write (`customer: { create: {} }`, exactly
  `saveOrder`'s shape) throws `Invalid \`prisma.user.create()\`
  invocation` on conflict — confirming Prisma implements this as an
  internal `create()` attempt, not a native atomic upsert, so the P2002
  is real, not dead code.
- That error did **not** reach the surrounding `try/catch` at all —
  reproduced identically both inside and outside a transaction, which
  rules out transaction-abort semantics as the cause (a non-transactional
  call has no ambient transaction to poison, yet the error still escaped
  the same way).

So this is a *different* mechanism than the one fixed above — something
in how this Prisma client version (6.19.3) dispatches errors from a
nested-write upsert's conflicting create-branch, not a Postgres
transaction-state issue. **Unverified on PostgreSQL** — SQLite and
Postgres have different transaction semantics, and this was only
reproduced against the former; no live Postgres connection was available
to confirm it generalizes. The fix that resolved the `order.create()`
case (catch outside the transaction) does not obviously apply here
either, since the symptom is the error skipping `try/catch` entirely,
not surviving inside a poisoned transaction — the correct fix, if this
does reproduce on Postgres, is not yet known (candidates include
restructuring the upsert to avoid the nested write, e.g. separate
`user.create()` + `customer.create()` calls). Deliberately left
un-fixed and out of this PR's scope: recorded here as a follow-up
investigation, not folded into Sprint 4's idempotency/capacity work.

---

## 2026-07-31 — Sprint 4 PR 5: live order-status polling, symbolic ETA/driver-progress, dedicated lean poll endpoint

**Decision:** `hooks/use-order-progress.ts`'s wall-clock simulation is
replaced with polling against real `OrderStatusEvent` rows, via a new,
dedicated `ordersRouter.getOrderStatus` procedure (not a reuse of
`getOrder`'s full query — see its own comment) on a 5-second interval,
implemented as a self-scheduling `setTimeout` chain (not `setInterval`)
so a slow response can't cause overlapping in-flight requests. The hook
is seeded with `StoredOrder.statusEvents` (already fetched once by
`OrderTrackerLoader`'s initial `getOrder` call) so the first render
already shows the correct stage — no duplicate immediate fetch, no
loading flash. Polling stops entirely once the latest event is
`ENTREGADO`, since nothing changes after delivery.

Two fields (`etaMinutes`, `driverProgress`) had no real backing data to
derive from — no live GPS/location exists (see `prisma/schema.prisma`'s
`Delivery` model comment), and no ETA source exists either. Rather than
either fabricate false precision (a ticking countdown, a continuously
"measured" position) or remove these UI elements (degrading the
experience), both became explicitly symbolic:
- `etaLabel`: a static, per-stage string ("15–20 min aprox." while
  `en_camino`), never recomputed from elapsed time — approximate, not a
  countdown.
- `driverProgress`: nudged forward a small fixed amount
  (`EN_CAMINO_STEP = 0.08`) on each successful poll while `en_camino`,
  capped below 1 (`EN_CAMINO_CAP = 0.92`) so it never visually "arrives"
  before the real `ENTREGADO` event says so, jumping to `1` immediately
  once it does. This keeps the map/driver UI feeling alive without
  claiming a measurement that doesn't exist — explicitly intended to be
  replaced by real tracking once driver dispatch/GPS lands in a later
  sprint, not extended further in the meantime.

**Why:** Removing the ETA/map entirely was considered and rejected —
noticeably degrades the tracking experience for no real gain, since the
underlying *status* (the actual point of this PR) is now fully real.
Keeping the old fabricated countdown/continuous-progress math was also
rejected — directly contradicts `docs/BACKEND_ARCHITECTURE.md` Phase 4's
"replacement, not extension" framing for the exact data this PR touches.
A poll-tick-driven symbolic value threads between both: honest (never
claims a precision that doesn't exist) and still visually alive.

**Scope note:** `mockDriver`/`data/orders.ts`'s driver info card is
unchanged — no real `Delivery`/`Driver` assignment exists anywhere in
this codebase yet (confirmed: nothing creates a `Delivery` row), so
that remains a separate, already-out-of-scope concern for a later
sprint, not something this PR's polling replacement touches.

**Known, accepted consequence — not a bug:** because `driverProgress` is
poll-tick-driven rather than elapsed-time-driven, reopening a tracking
link for an order that has been `en_camino` for a while shows the
symbolic progress restarting near its initial value each time, rather
than reflecting how long ago the real event actually happened. This is
inherent to a deliberately non-measuring, decorative value — the
alternative (deriving it from real elapsed time) would reintroduce the
exact fabricated-precision problem this design avoids.

---

## 2026-07-31 — Sprint 5 pre-implementation architectural review

**Decision:** Before any Sprint 5 code, `docs/ROADMAP.md`, `docs/BACKEND_ARCHITECTURE.md`,
`docs/SECURITY_ARCHITECTURE.md`, `docs/ENGINEERING_STANDARDS.md`,
`docs/PROJECT_STATUS.md`, this file, `CONTRIBUTING.md`, and the current
codebase were re-read in full and cross-checked against each other. No
drift was found between the documentation and the actual code
(`prisma/schema.prisma`'s identity block, `server/trpc/trpc.ts`'s
`protectedProcedure` stub, and `app/admin/page.tsx`'s current lack of any
access control all matched what the docs claimed). The review surfaced
several gaps the existing docs didn't yet resolve, listed below with what
was decided.

**Staff account provisioning is admin-created with a temporary password,
not a token-based email invite.** `docs/BACKEND_ARCHITECTURE.md` §6 said
"invite-only" without specifying a mechanism, and no `Invite`-style entity
exists anywhere in §3 or the schema. Evaluated against a token-based email
invite (an `Invite` entity, a hashed/expiring token, delivery via Resend).
Rejected the email-invite route for now: it pulls Resend into scope a full
milestone earlier than the roadmap otherwise schedules it and adds a new
entity/router for a team at this size that doesn't need it yet. An admin
creates the `User`/role directly with a temporary password (relayed
out-of-band) and the account is forced to change it on first login
(`User.mustChangePassword`, added in PR1 below). Revisit if/when team size
or staff turnover makes out-of-band password relay genuinely impractical.

**Sprint 5 PR1 (schema only) adds:** `User.emailVerified` (standard
Auth.js Prisma-adapter field — added after initial review of this PR,
once it was confirmed PR2's magic-link provider requires it; null for
every row today, since no verification mechanism exists yet, and adding
it now avoids a second migration when PR2 starts Auth.js), `User.passwordHash`
(argon2, staff credentials login only — customers never set this),
`User.mustChangePassword` (set on admin-created accounts, cleared once the
staff member sets their own password), `User.totpSecret` (encrypted TOTP
secret, column reserved now so the enrollment/verification PR needs no
migration of its own), and a new `RecoveryCode` model (hashed, single-use
MFA recovery codes, `SECURITY_ARCHITECTURE.md` §4.2). `MFA_ENCRYPTION_KEY` (encrypts
`totpSecret`, kept independent from `AUTH_SECRET` so rotating one never
invalidates the other per §16.2) and `BOOTSTRAP_ADMIN_EMAIL`/
`BOOTSTRAP_ADMIN_PASSWORD` (the first-admin provisioning path §6 already
required but never added to §10's variable list) are added to
`docs/BACKEND_ARCHITECTURE.md` §10 and mirrored in `.env.example`. No
auth logic, adapters, routes, or login flows are implemented in this PR —
matching the same schema-then-logic sequencing Sprint 3 already
established for the rest of the identity tables.

**Deferred to later Sprint 5 PRs, each requiring its own explicit
decision at the time:** the two-Auth.js-instance session-strategy design
(JWT for customers, database sessions for staff), where `/admin` route
gating actually runs (a Node-runtime layout check, not Edge middleware,
given database-backed staff sessions), whether `branch_manager` needs MFA
given Morel's current single-branch operation, guest-checkout-to-real-login
account linking (`allowDangerousEmailAccountLinking`), whether Upstash
rate limiting ships within Sprint 5 given `SECURITY_ARCHITECTURE.md` §6.7's
MUST first becomes live the moment Sprint 5's login endpoints exist, and
Google OAuth's incompatibility with per-PR Vercel preview URLs. None of
these affect PR1's schema-only scope.

**Trade-off:** `passwordHash`/`totpSecret` sit unused on every `User` row
until the PRs that implement credentials login and MFA enrollment land —
accepted, matching the same trade-off Sprint 3 already made landing the
rest of the identity schema two sprints ahead of its logic.

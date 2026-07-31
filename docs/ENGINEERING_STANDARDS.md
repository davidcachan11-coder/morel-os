# Engineering Standards

**Status:** Permanent engineering standard. Binding on all future implementation.
**Relationship to other docs:** `CONTRIBUTING.md` defines *workflow* — how
to name a commit, structure a branch, open a PR. This document defines
the *technical quality bar* that workflow exists to enforce — what
correct, maintainable code looks like in this codebase, at the level of
architecture boundaries, type safety, testing, error handling, and
performance. `docs/SECURITY_ARCHITECTURE.md` and
`docs/INFRASTRUCTURE_ARCHITECTURE.md` cover their respective domains in
depth; this document covers everything else that makes code "done."

This document uses **MUST**/**MUST NOT**/**SHOULD** as binding requirement
language, consistent with the project's other standards documents.

---

## 1. Purpose and Scope

Every line of code written for Morel — frontend, backend, migrations,
background jobs — is expected to meet the standards in this document.
It applies equally to a solo contributor and a future team; the goal is
that code written in Sprint 12 is indistinguishable in quality and
pattern from code written in Sprint 3, without anyone needing to
re-derive "how we do things here" from scratch.

---

## 2. Core Engineering Principles

Extends `docs/BACKEND_ARCHITECTURE.md` §23's Architecture Principles with
principles specific to day-to-day engineering work:

- **Type safety is not optional.** `tsconfig.json`'s `strict: true` MUST
  remain enabled permanently. A type error MUST be fixed, never suppressed
  with `@ts-ignore`/`@ts-expect-error` without a comment explaining why
  suppression is correct in that specific case.
- **Runtime validation at every boundary.** TypeScript types describe
  what the code *expects*; Zod validation describes what's *actually
  true* about data crossing a trust boundary (API input, webhook payload,
  environment variable). Both are required — see §3.
- **Readable over clever.** Code is read far more often than it is
  written. A slightly longer, obviously-correct implementation is
  preferred over a dense one-liner that requires the reader to hold more
  in their head.
- **Fail fast, fail loud.** Errors MUST surface immediately and clearly —
  no silent `catch` blocks that swallow an error and continue as if
  nothing happened (see §7 for the one narrow exception).
- **No speculative abstraction.** Build the interface the current feature
  needs. Do not add configurability, generic parameters, or extension
  points for a use case that doesn't exist yet — this directly continues
  the project's existing discipline (`docs/DECISIONS.md`'s "Sprint 1"
  entry: `providers/` and `types/` were left empty rather than populated
  speculatively).

---

## 3. Language and Type Safety Standards

- TypeScript `strict: true` MUST remain enabled. `any` MUST NOT be used —
  if a type is genuinely unknown, use `unknown` and narrow it explicitly.
- Every domain concept MUST be a named, exported `interface`/`type`,
  matching the existing pattern in `data/*.ts` — no inline object-shape
  types for anything that represents a reused domain concept.
- Every tRPC procedure input, and every webhook payload, MUST be parsed
  through a Zod schema before use (`docs/SECURITY_ARCHITECTURE.md` §6.1).
  A TypeScript type alone at an API boundary is insufficient.
- Prefer `type` for unions/utility compositions and `interface` for
  object shapes that may be extended, matching existing usage across
  `data/*.ts`, `lib/cart-store.ts`, and `services/orders.ts`.

---

## 4. Architectural Boundaries

These boundaries are binding, not advisory — they are what makes the
`docs/BACKEND_ARCHITECTURE.md` migration plan (§19) possible without a
component-level rewrite at each phase:

- **Components MUST NOT import Prisma, a database client, or any
  `server/`-only module directly.** All data access from a component goes
  through `services/` (today) or the equivalent tRPC hook (post-migration)
  — never around it.
- **`server/` code MUST import the `server-only` package** at the top of
  every file, making accidental client-bundle inclusion a build error
  (`docs/BACKEND_ARCHITECTURE.md` §9).
- **A `services/` (or future router) function's exported signature is a
  contract.** Changing what's *inside* the function (e.g., swapping
  `localStorage` for a real API call) MUST NOT require changing its
  call sites, by design — this is the entire reason Sprint 1 introduced
  the boundary (`docs/DECISIONS.md`).
- **Business logic lives in `server/trpc/routers/*` as plain functions**,
  not scattered across component `onClick` handlers — a component
  orchestrates UI state and calls a router/service function; it does not
  itself contain business rules (tax computation, order-total
  calculation, authorization decisions).
- **New code goes in the folder its nature dictates**
  (`docs/ARCHITECTURE.md`'s folder table): domain data and types in
  `data/`, primitive constants in `constants/`, structured configuration
  in `config/`, custom hooks in `hooks/`, persisted/remote data access in
  `services/`, cross-cutting utilities in `lib/utils.ts`. When a new file
  doesn't obviously fit, that's a signal to raise it, not to guess and
  move on (`CONTRIBUTING.md`'s folder-conventions table).

---

## 5. API and Router Design Standards

- Every tRPC procedure MUST declare its required role(s) via the
  `protectedProcedure(role)` middleware pattern
  (`docs/BACKEND_ARCHITECTURE.md` §7) — there is no such thing as an
  internal procedure with no authorization requirement; public procedures
  MUST be explicitly marked public, not merely unmarked.
- Branch-scoped procedures MUST derive `branchId` from the authenticated
  session server-side — MUST NEVER accept it as a trusted client
  parameter for authorization purposes (`docs/SECURITY_ARCHITECTURE.md`
  §4.3).
- Router and procedure names MUST mirror the entity/domain groupings in
  `docs/BACKEND_ARCHITECTURE.md` §3 and §8 (`catalogRouter`,
  `ordersRouter`, `fiscalRouter`, etc.) — a new domain gets a new router,
  not a growing miscellany added to an existing one.
- Procedure function shapes SHOULD mirror the current `services/*.ts`
  function shapes wherever a direct migration mapping exists (`getOrder`,
  `saveOrder`, …) per the migration plan
  (`docs/BACKEND_ARCHITECTURE.md` §19 Phase 2–3).

---

## 6. Data and Database Standards

- Every Prisma schema change MUST go through a generated migration
  (`prisma migrate dev` locally, `prisma migrate deploy` in CI) — MUST
  NEVER be applied by hand against a shared database.
- Migration files MUST NEVER be hand-edited after generation.
- Time-sensitive/mutable references (an order's delivery address, its
  delivery slot) MUST be snapshotted at the time of the transaction, not
  stored as a live foreign-key-only reference — matching the existing
  `StoredOrder.address` pattern and its documented rationale
  (`docs/BACKEND_ARCHITECTURE.md` §4).
- Regulatory/audit-sensitive records (`FiscalReceipt`, `AuditLog`) MUST
  be append-only at the application layer — corrections are new, linked
  records, never mutations (`docs/SECURITY_ARCHITECTURE.md` §5.2).
- Money values MUST use Prisma's `Decimal` type, never `Float` — floating-
  point rounding error is unacceptable for currency and tax computation.
- New tables that will grow without bound (event/audit-log-shaped tables)
  SHOULD be designed with future date-partitioning in mind (an
  indexed, queryable `createdAt`) even though partitioning itself is
  deferred (`docs/BACKEND_ARCHITECTURE.md` §15).

---

## 7. Error Handling Standards

- Errors MUST propagate to a layer that can meaningfully handle them —
  either surfaced to the user (a validation error, a payment failure) or
  logged with enough context to diagnose (a correlation ID, the relevant
  entity ID, per `docs/BACKEND_ARCHITECTURE.md` §18.1).
- A `catch` block MUST NOT silently discard an error and continue as if
  the operation succeeded. **The one narrow, explicitly-allowed exception**
  is `services/orders.ts`'s existing pattern of catching a `localStorage`
  JSON-parse failure and returning an empty result — documented here as
  intentional because corrupted client-side storage is expected-possible
  and the correct behavior genuinely is "treat as empty," not a bug to
  surface. Any new silent catch MUST have an equally explicit, documented
  justification, or it MUST rethrow/log.
- User-facing error messages MUST be distinct from internal error
  detail — a customer sees "algo salió mal, intentá de nuevo," not a
  stack trace or a raw database error string.
- Payment and webhook processing errors are security-relevant per
  `docs/SECURITY_ARCHITECTURE.md` §6.5 — these MUST fail closed (reject
  the operation) rather than fail open (assume success).

---

## 8. Testing Standards

No test runner exists yet (`docs/PROJECT_STATUS.md` pending items). This
is the standard the first testing effort MUST meet, not a description of
current state:

- **Unit tests** are required for pure, logic-heavy functions with no
  external dependency — `lib/cart-store.ts`'s reducer logic,
  `hooks/use-order-progress.ts`'s status-derivation math (both explicitly
  called out as cheap-to-test in `docs/ROADMAP.md` Sprint 7), and, once
  built, ITBIS/tax computation and NCF-sequence logic given their
  regulatory sensitivity.
- **Integration tests** are required for tRPC routers once they exist —
  each router's procedures tested against a real (test-database-branch)
  Postgres instance, not mocked, to catch authorization and query
  correctness together.
- **No end-to-end/UI test framework is mandated at this stage** — manual
  verification (per `CONTRIBUTING.md`'s PR standards) remains acceptable
  for UI-level changes until the team/surface area grows enough to
  justify the investment. This is a deliberate "simplicity over
  overengineering" call, not an oversight.
- Tests MUST run in CI (`docs/INFRASTRUCTURE_ARCHITECTURE.md` §7) once
  they exist — a test suite that isn't enforced in CI is decoration, not
  a safety net.
- Security-sensitive logic (authorization checks, webhook signature
  verification, payment status transitions) MUST have test coverage
  before Phase 6 (`docs/BACKEND_ARCHITECTURE.md` §19) ships — this is a
  launch-blocking requirement, not a nice-to-have.

---

## 9. Logging and Observability Standards

Restates `docs/BACKEND_ARCHITECTURE.md` §18 as binding, not merely
recommended:

- Logs MUST be structured (JSON), not free-text — timestamp, severity, a
  request/correlation ID, and relevant entity IDs on every line.
- A correlation ID MUST be threaded through tRPC context and into any
  background job an event triggers, so one user action can be traced as
  one thread across multiple function invocations.
- PII MUST NOT appear in logs or error-tracking event data by default
  (`docs/SECURITY_ARCHITECTURE.md` §5.2) — scrubbing rules are a
  prerequisite for shipping a feature that touches customer data, not a
  follow-up task.

---

## 10. Performance Standards

- Database connection pooling MUST be configured — not optional in this
  serverless deployment (`docs/BACKEND_ARCHITECTURE.md` §15,
  `docs/INFRASTRUCTURE_ARCHITECTURE.md` §6).
- Queries MUST avoid N+1 patterns — use Prisma's `include`/`select` to
  fetch related data in one query rather than looping and querying per
  item.
- Anything that doesn't need to block a user-facing response (notification
  dispatch, AI insight generation, inventory reconciliation) MUST run as
  a background job (Inngest), not inline in the request path.
- Product/catalog images MUST be served via CDN once real photography
  replaces the current emoji placeholders — MUST NEVER be proxied through
  a serverless function.
- Search/filter operations over growing datasets (the product catalog,
  once real and large) SHOULD move server-side with debouncing once
  client-side filtering (today's `/tienda` pattern) stops being
  instantaneous at real data volume.

---

## 11. Accessibility Standards

- Every new interactive element MUST have an accessible name (`aria-label`
  where the visible text doesn't already serve that purpose) — matching
  the standard already met by the current cart/search/quantity controls
  (`docs/PROJECT_STATUS.md`'s audit did not find gaps here; new code MUST
  maintain that bar, not regress it).
- Every form MUST use a real `<form>` element with proper `autoComplete`
  hints for the fields it contains — the current checkout payment step's
  lack of a `<form>` wrapper is a known, tracked gap
  (`docs/PROJECT_STATUS.md` pending items) to be fixed, not a pattern to
  replicate in new code.
- Grouped single-select controls (delivery slot picker, category filters,
  and any future equivalent) MUST expose `role="radiogroup"`/
  `aria-pressed` or equivalent semantics — visual selection state alone
  is not sufficient.
- Color MUST NOT be the sole means of conveying status — every
  color-coded state needs an accompanying text label, matching the
  existing pattern in delivery-slot capacity indicators.

---

## 12. Documentation Standards

- A new architectural decision (a new dependency, a changed pattern, a
  reversal of a prior choice) MUST get a dated entry in
  `docs/DECISIONS.md` with the reasoning, matching the project's existing
  discipline since Sprint 1.5.
- A change to the folder structure, data flow, or state management
  approach MUST be reflected in `docs/ARCHITECTURE.md` — that document
  is a living reference, not a one-time snapshot, and MUST NOT be allowed
  to drift from the actual codebase.
- Code comments explain **why**, never **what** — a well-named function
  doesn't need a comment restating its name in prose. Comment a genuinely
  non-obvious constraint, a workaround, or a deliberate simplification
  (matching the existing comment in `hooks/use-order-progress.ts`
  explaining why its wall-clock simulation exists).
- A new entity introduced anywhere in the codebase MUST appear in
  `docs/BACKEND_ARCHITECTURE.md` §3's entity list (or its eventual
  successor) before or alongside its implementation — the data model
  documentation MUST NOT lag behind the actual schema.

---

## 13. Code Review Standards

Extends `CONTRIBUTING.md`'s review checklist with technical depth
expectations:

- A reviewer MUST verify that new authorization-sensitive code enforces
  its role check server-side, not just confirm the code "looks like it
  probably does."
- A reviewer MUST verify that new database access goes through the
  correct architectural boundary (§4), not just that it "works."
- A reviewer MUST check for accidental duplication of an existing
  `constants/`, `config/`, or `data/` value before approving a new
  hardcoded literal — the project has a documented history of exactly
  this kind of duplication being found and fixed
  (`docs/DECISIONS.md`'s Sprint 1 entry).
- A PR that introduces a new external dependency MUST note why an
  existing dependency couldn't serve the same purpose — dependency count
  is a cost, not a neutral choice.

---

## 14. Definition of Done

A change is not complete until all of the following are true:

- [ ] `npm run build` passes with zero errors.
- [ ] `npm run lint` passes with zero errors or warnings.
- [ ] Relevant tests pass (once a test suite exists, §8).
- [ ] No `any`, no unexplained `@ts-ignore`, no silently swallowed errors
      outside the one documented exception in §7.
- [ ] Manually verified end-to-end for the specific flow changed,
      including at mobile width where the change touches UI
      (`CONTRIBUTING.md`'s PR standards).
- [ ] No new hardcoded value duplicates something that already exists in
      `constants/`, `config/`, or `data/`.
- [ ] Relevant documentation updated (§12) — `docs/DECISIONS.md`,
      `docs/ARCHITECTURE.md`, `docs/BACKEND_ARCHITECTURE.md`'s entity
      list, or `docs/PROJECT_STATUS.md`, as applicable.
- [ ] For anything security/auth/payment-adjacent: reviewed against
      `docs/SECURITY_ARCHITECTURE.md` §11's pre-merge checklist.

---

## 15. Deviation Process

A MUST in this document, `docs/SECURITY_ARCHITECTURE.md`, or
`docs/INFRASTRUCTURE_ARCHITECTURE.md` MAY be deviated from only when:

1. The deviation is genuinely required by circumstance (not convenience).
2. It is recorded as a dated entry in `docs/DECISIONS.md`, stating what
   standard was deviated from and why.
3. The deviation is scoped as narrowly as possible — a one-off exception,
   not a silent lowering of the standard for all future code.

An undocumented deviation is a defect against these standards, not a
judgment call — the standards exist precisely so that "why did we do it
this way" never again requires reverse-engineering from git history
alone (`docs/DECISIONS.md`'s own stated purpose).

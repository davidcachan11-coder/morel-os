# Infrastructure Architecture

**Status:** Permanent engineering standard. Binding on all future implementation.
**Relationship to other docs:** `docs/BACKEND_ARCHITECTURE.md` selected the
individual infrastructure vendors (Vercel, Neon, Inngest, Upstash, Vercel
Blob/R2, Azul/CardNet, Twilio, Resend, Sentry) and justified each choice.
This document defines how those pieces operate together as a system —
environments, deployment topology, CI/CD, and operational ownership — as
a standing reference that survives any individual vendor being swapped.
`docs/SECURITY_ARCHITECTURE.md` governs the security requirements this
infrastructure must satisfy; this document governs how it's built,
deployed, and operated.

This document uses **MUST**/**MUST NOT**/**SHOULD** as binding requirement
language, consistent with `docs/SECURITY_ARCHITECTURE.md`.

---

## 1. Purpose and Scope

Defines the environments this application runs in, how a change moves
from a developer's machine to production, and who is responsible for
each piece of infrastructure. Applies from the first backend PR onward —
not retrofitted after infrastructure already exists ad hoc.

---

## 2. Infrastructure Principles

Extends `docs/BACKEND_ARCHITECTURE.md` §23's principles into operational
rules:

- **Managed-first.** Every infrastructure component is a managed service
  (Neon, Vercel, Inngest, Upstash) unless a specific, documented reason
  requires self-hosting. This team does not operate servers, patch
  operating systems, or run its own database — that operational burden is
  explicitly rejected as out of scope at this stage
  (`docs/BACKEND_ARCHITECTURE.md` §1.2, §1.3).
- **Serverless-native.** Every piece of infrastructure MUST be compatible
  with Vercel's serverless function model (stateless, short-lived,
  connection-pooled) — this is why background jobs use Inngest instead of
  a persistent worker, and why Postgres access is always pooled
  (`docs/BACKEND_ARCHITECTURE.md` §15).
- **No infrastructure without a current need.** Read replicas, dedicated
  compute, and infrastructure-as-code tooling are all deferred until real
  load or team size justifies them (§9) — provisioning ahead of need is
  waste, not prudence, per `docs/BACKEND_ARCHITECTURE.md` §23's
  "Scalability without Overengineering."
- **Every environment is disposable and reproducible.** No environment
  (including production) should depend on manual, undocumented setup
  steps that can't be repeated — see §8 for the CI/CD standard that
  enforces this.

---

## 3. Environments

Three environments are required. None of these exist yet as of this
writing (`docs/PROJECT_STATUS.md`) — this section is the standard the
first infrastructure sprint must implement.

| Environment | Purpose | Database | Deployed from |
|---|---|---|---|
| **Development (local)** | Individual development | Local Postgres or a personal Neon branch | Not deployed — `next dev` locally |
| **Preview** | Per-PR review, QA before merge | A fresh Neon database branch per PR (Neon's branching feature, `docs/BACKEND_ARCHITECTURE.md` §1.3), seeded via `prisma/seed.ts` | Every PR against `production-v1`, automatically via Vercel's preview-deploy integration |
| **Production** | Real traffic | The single production Neon database (§4) | `production-v1` (or its eventual `main`-equivalent once the demo freeze convention in `docs/DECISIONS.md` is retired) on merge |

### 3.1 Environment Parity Rules

- Preview and Production MUST run the same application code path — no
  environment-specific business logic branches (e.g., "if preview, skip
  payment verification"). Environment-specific *configuration* (API keys,
  webhook URLs) is expected and required; environment-specific *behavior*
  is not.
- Preview environments MUST use sandbox/test credentials for every
  third-party provider (Azul, CardNet, Twilio, Resend) — MUST NEVER share
  production credentials with a preview deploy.
- Preview databases MUST be seeded from `prisma/seed.ts`
  (`docs/BACKEND_ARCHITECTURE.md` §19 Phase 1) — never manually
  populated, so every preview environment starts from the same
  reproducible state.
- **Production data, including any customer PII, MUST NEVER be copied,
  dumped, or replicated into Preview or Development environments under
  any circumstance, including for debugging.** If a production-only bug
  requires investigation, investigate against production (with
  appropriate access controls and audit logging per
  `docs/SECURITY_ARCHITECTURE.md` §9) rather than exporting real customer
  data to a lower environment.

---

## 4. Deployment Topology

```
                        ┌─────────────────────┐
                        │   Vercel (Next.js)   │
                        │  App Router + tRPC    │
                        │  + Route Handlers      │
                        └──────────┬───────────┘
                                   │
        ┌──────────────┬──────────┼──────────┬──────────────┬─────────────┐
        ▼              ▼          ▼          ▼              ▼             ▼
   ┌─────────┐   ┌───────────┐ ┌──────┐ ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Neon    │   │  Upstash   │ │Inngest│ │  Vercel  │  │  Twilio   │  │  Resend   │
   │ Postgres │   │   Redis    │ │(jobs) │ │   Blob   │  │ WhatsApp/ │  │  (email)  │
   │ (pooled) │   │(cache/rate)│ │       │ │ (files)  │  │    SMS    │  │           │
   └─────────┘   └───────────┘ └──────┘ └──────────┘  └──────────┘  └──────────┘

        ┌──────────────┬──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌───────────┐  ┌──────────┐
   │  Azul    │   │  CardNet   │  │  Sentry   │
   │(payments)│   │ (payments) │  │(monitoring)│
   └─────────┘   └───────────┘  └──────────┘
```

Every arrow from Vercel outward is a **trust boundary** per
`docs/SECURITY_ARCHITECTURE.md` §3.3 — each integration MUST be behind
its own router/service boundary (`docs/BACKEND_ARCHITECTURE.md` §9), and
inbound arrows (Azul, CardNet, Twilio webhooks) MUST be signature-verified
(`docs/SECURITY_ARCHITECTURE.md` §6.5).

---

## 5. Hosting and Compute

- **Vercel** hosts both the Next.js frontend and the tRPC/Route Handler
  API layer — one deployment target, no separate backend service
  (`docs/BACKEND_ARCHITECTURE.md` §1.1).
- Function region SHOULD be selected close to the Neon database region
  (§6) to minimize function-to-database latency — co-locating compute and
  database region is a standard, low-effort win.
- Vercel's instant-rollback capability is the primary deployment-incident
  response tool (§10, `docs/BACKEND_ARCHITECTURE.md` §17.4) and MUST be
  the default first response to a deploy-caused incident.

---

## 6. Database Infrastructure

- **Neon**, region selected close to the Dominican Republic (US East /
  `us-east-1`-adjacent — `docs/BACKEND_ARCHITECTURE.md` §2).
- **Connection pooling is mandatory from the first deployment.** Every
  Vercel function invocation can open a new database connection; without
  Neon's built-in pooler (or Prisma Accelerate), Postgres will exhaust
  its connection limit under moderate concurrent load
  (`docs/BACKEND_ARCHITECTURE.md` §15). This MUST be configured as part
  of initial infrastructure setup, not retrofitted after an incident.
- **Two database roles minimum**, per `docs/SECURITY_ARCHITECTURE.md`
  §7.3: an application runtime role (scoped, no schema-altering
  permissions) and a migration role (used only by the deploy pipeline,
  §8).
- **Branch-per-PR** for preview environments (§3), using Neon's native
  database branching — MUST NOT hand-roll a separate preview-database
  provisioning mechanism when the provider already provides one.
- **Read replicas** are deferred until dashboard read load (Executive,
  Finance aggregate queries) measurably contends with transactional order
  writes — not provisioned speculatively (`docs/BACKEND_ARCHITECTURE.md`
  §15).

---

## 7. CI/CD Pipeline

No CI currently exists (`docs/PROJECT_STATUS.md` pending items). This is
the standard the first CI implementation MUST meet:

### 7.1 Required Checks Before Merge

- `npm run build` MUST pass with zero errors.
- `npm run lint` MUST pass with zero errors or warnings.
- `npm ci` (not `npm install`) MUST be used, for lockfile-integrity
  reproducibility (`docs/SECURITY_ARCHITECTURE.md` §8).
- A dependency vulnerability scan (`npm audit` at minimum) MUST run.
- Once tests exist (`docs/ENGINEERING_STANDARDS.md` §8), they MUST pass.
- `prisma migrate diff`/validation SHOULD run against the preview
  database branch to catch migration errors before they reach a shared
  environment.

### 7.2 Required Steps Before Production Deploy

- `prisma migrate deploy` MUST run under the scoped migration database
  role (§6), MUST NEVER run under the application's runtime role, and
  MUST be a required, automated CI step — never a manual, undocumented
  step someone remembers to run.
- Migration files MUST NEVER be hand-edited after generation.

### 7.3 Branch Protection

- Direct pushes to the production branch MUST be disabled — every change
  MUST go through a PR meeting the checks in §7.1, consistent with
  `CONTRIBUTING.md`'s branch strategy and PR standards.
- The frozen demo branch (`main`, per `docs/DECISIONS.md`) MUST remain
  protected from any direct commit, permanently — this rule predates and
  is independent of the CI work described here.

---

## 8. Background Jobs and Async Infrastructure

- **Inngest** hosts all durable background work: order-status-progression
  events, notification dispatch, inventory sync, and future AI-insight
  jobs (`docs/BACKEND_ARCHITECTURE.md` §1.6, §14).
- Job payloads MUST NOT contain secrets directly — a job fetches
  credentials from environment/database at execution time, never receives
  them as part of its triggering event payload.
- Jobs MUST be idempotent wherever they have an external side effect
  (sending a notification, writing a `Payment` status) — Inngest's retry
  behavior means a job may execute more than once for the same trigger.

---

## 9. Caching and Rate-Limiting Infrastructure

- **Upstash Redis**, HTTP-based client, for KPI/catalog caching and
  per-IP rate limiting on public endpoints
  (`docs/BACKEND_ARCHITECTURE.md` §1.7).
- Rate-limit thresholds MUST be defined for every public endpoint before
  that endpoint ships to production, per
  `docs/SECURITY_ARCHITECTURE.md` §6.7.

---

## 10. File Storage Infrastructure

- **Vercel Blob** to start; migration to **Cloudflare R2** is planned
  (not speculative) once product photography drives meaningful egress
  volume (`docs/BACKEND_ARCHITECTURE.md` §1.8, §11). This migration
  trigger SHOULD be revisited at each cost review (§13) rather than
  forgotten about.
- All uploads MUST use signed, direct-to-storage URLs — file bytes MUST
  NEVER be proxied through a serverless function.

---

## 11. Third-Party Service Inventory

| Service | Purpose | Criticality | Failure mode if unavailable |
|---|---|---|---|
| Vercel | Hosting, compute, deployment | Critical | Full outage — see `docs/BACKEND_ARCHITECTURE.md` §17.3 |
| Neon | Database | Critical | Full outage — see §17.3 |
| Auth.js | Authentication (self-hosted library, not a vendor) | Critical | N/A — no external dependency |
| Inngest | Background jobs | High | Jobs delayed, not lost |
| Upstash | Caching, rate limiting | Medium | Degraded performance, rate limiting fails open or closed per configuration (MUST fail closed for security-relevant limits) |
| Vercel Blob / R2 | File storage | Medium | New uploads fail; existing content unaffected |
| Twilio | WhatsApp/SMS notifications | High | Customers don't receive real-time updates; in-app/email fallback continues |
| Resend | Email | Medium | Receipts/confirmations delayed |
| Azul | Primary payment processor | Critical (revenue) | Checkout fails over to CardNet |
| CardNet | Secondary payment processor | Critical (revenue) | Checkout fails over to Azul; COD remains available |
| Sentry | Error tracking, monitoring | High (operational visibility) | Errors undetected until user-reported |

This table MUST be kept current — a new vendor integration is not
complete until it has a row here with an assigned criticality and
documented failure mode, cross-referenced against
`docs/BACKEND_ARCHITECTURE.md` §17.3's outage-scenario table.

---

## 12. Secrets and Configuration Management

- The full required environment variable list is defined in
  `docs/BACKEND_ARCHITECTURE.md` §10 and governed by
  `docs/SECURITY_ARCHITECTURE.md` §7.
- **Adding a new environment variable is a two-step process:** (1) add it
  to `docs/BACKEND_ARCHITECTURE.md` §10's documented list with a comment
  explaining its purpose, (2) set it in Vercel's environment-variable
  system for every environment that needs it (§3) — a variable set only
  in Production but required by application code will silently break
  Preview, and MUST be caught in review before merge.
- `.env.example` MUST mirror the documented list with empty values —
  currently missing, tracked as a pending item
  (`docs/PROJECT_STATUS.md`).

---

## 13. Disaster Recovery Operations

`docs/BACKEND_ARCHITECTURE.md` §17 defines the recovery objectives (RPO
≤ 5 min, RTO targets) and the outage-scenario table. This document adds
the operational ownership those targets require:

- A restore-from-PITR drill MUST be executed and documented at least
  quarterly, against a scratch environment — an untested backup is not a
  real recovery plan (`docs/BACKEND_ARCHITECTURE.md` §17.1).
- The person executing a production restore MUST follow a written
  runbook, not improvise under incident pressure — this runbook is a
  required artifact of the first infrastructure sprint, not yet written
  as of this document.
- Deployment rollback (Vercel instant rollback) is the default first
  response to any deploy-caused incident, before any database-level
  recovery action is considered (`docs/BACKEND_ARCHITECTURE.md` §17.4).

---

## 14. Cost Governance

- The cost tiers and estimates in `docs/BACKEND_ARCHITECTURE.md` §20 are
  the budget planning baseline. This document adds the operational
  practice:
- Actual spend SHOULD be reviewed monthly against the relevant tier's
  estimate, with attention to services that transition from free to paid
  as usage crosses a threshold (`docs/BACKEND_ARCHITECTURE.md` §20's
  "what stays free" guidance) — a surprise bill indicates this review
  didn't happen, not that the estimate was wrong.
- Twilio (WhatsApp/SMS) usage SHOULD be monitored from the first
  production deploy, since it has no meaningful free tier and scales
  directly with notification volume.
- Payment-processing fees are excluded from infrastructure cost review
  (they belong in a revenue/margin model, `docs/BACKEND_ARCHITECTURE.md`
  §20) but SHOULD still be visible to whoever owns cost governance.

---

## 15. Infrastructure-as-Code Stance

- This project does **not** use Terraform or an equivalent IaC tool today,
  and MUST NOT adopt one speculatively. Every infrastructure component in
  this document is provisioned through its provider's dashboard or CLI,
  with the setup steps documented (this document, plus a future runbook
  per §13) rather than codified.
- **Trigger for adopting IaC:** when infrastructure changes become
  frequent enough, or the team large enough, that dashboard-driven
  configuration causes real drift or coordination problems — not on a
  fixed timeline. This is a `docs/DECISIONS.md`-worthy decision when it
  happens, consistent with `docs/BACKEND_ARCHITECTURE.md` §23's
  "Simplicity over Complexity" principle.

---

## 16. Ownership and Change Management

- Infrastructure changes (adding a provider, changing a region, altering
  the deployment topology) MUST be recorded in `docs/DECISIONS.md`,
  following the project's existing decision-recording discipline —
  infrastructure decisions are architecture decisions.
- This document MUST be updated whenever the third-party service
  inventory (§11) or environment topology (§3, §4) changes — it is a
  living reference, not a one-time snapshot.

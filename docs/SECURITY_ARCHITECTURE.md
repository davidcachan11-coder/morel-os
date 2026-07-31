# Security Architecture

**Status:** Permanent engineering standard. Binding on all future implementation.
**Relationship to other docs:** `docs/BACKEND_ARCHITECTURE.md` §16 (Security
& Hardening) and §17 (Disaster Recovery) contain the *design analysis* —
the options considered and why Auth.js/Azul/CardNet/Twilio etc. were
chosen. This document is the *standing policy* those decisions must
satisfy, and that every future decision must continue to satisfy, even
after the specific vendors in `docs/BACKEND_ARCHITECTURE.md` change.
Where the two overlap, this document states the rule; `docs/BACKEND_ARCHITECTURE.md`
states how the current design implements it.

This document uses **MUST**/**MUST NOT**/**SHOULD** as binding requirement
language. A MUST that cannot be met needs a documented exception in
`docs/DECISIONS.md`, not a silent deviation.

---

## 1. Purpose and Scope

Morel handles customer PII (names, addresses, phone numbers), payment
metadata, and Dominican fiscal/tax records (NCF receipts, ITBIS amounts).
This document defines the security posture required to handle that data
responsibly, at every layer from database roles up through incident
response. It applies to every future sprint, every contributor, and every
vendor integration — not just the backend implementation described in
`docs/BACKEND_ARCHITECTURE.md`.

---

## 2. Security Principles

These extend `docs/BACKEND_ARCHITECTURE.md` §23's "Security First" and
"Server-side Authorization" principles into concrete, enforceable rules:

- **Secure by default.** A new endpoint, role, or feature MUST start with
  zero access and have access explicitly granted — never start permissive
  and get locked down later.
- **Defense in depth.** No single control is trusted alone — authorization
  is enforced server-side even though the UI also hides unauthorized
  actions; webhooks are signature-verified even though they arrive over
  TLS; rate limiting exists even though authentication is also required.
  Redundant controls are intentional, not wasteful.
- **Fail closed.** When a security-relevant check cannot be completed
  (a signature can't be verified, a session lookup errors, a role can't
  be resolved), the system MUST deny the action, never proceed
  optimistically.
- **Least privilege, always.** Every credential, database role, and
  authorization grant is scoped to the minimum required — see §7.
- **Data minimization.** Collect and retain only the customer/staff data
  actually required for the feature in question. Do not add a data field
  "because it might be useful later."

---

## 3. Threat Model

### 3.1 Assets to Protect

| Asset | Sensitivity | Where it lives (per `docs/BACKEND_ARCHITECTURE.md`) |
|---|---|---|
| Customer PII (name, phone, address) | Confidential | `Customer`, `Address`, `User` |
| Payment metadata (provider refs, amounts — never raw card data) | Restricted | `Payment`, `Refund` |
| Fiscal/tax records (NCF, ITBIS) | Restricted, regulatory | `FiscalReceipt`, `TaxCategory` |
| Staff/admin credentials and sessions | Restricted | `User`, `Account`, `Session` |
| Business operational data (orders, inventory, revenue) | Confidential | `Order`, `InventoryItem`, dashboards |
| Source code and infrastructure credentials | Restricted | Repository, Vercel/provider env vars |

### 3.2 Actors

- **Customers** — authenticated via Auth.js, access only their own data.
- **Staff** (`branch_staff` through `admin` per `docs/BACKEND_ARCHITECTURE.md` §7) — varying trust levels, the primary insider-risk surface.
- **Drivers** — a constrained external-facing role with access to assigned deliveries only.
- **External attackers** — targeting the public storefront, checkout, login, and webhook endpoints.
- **Third-party providers** (Azul, CardNet, Twilio, Resend) — trusted only through verified, signed callbacks, never trusted implicitly because they are "our vendor."

### 3.3 Trust Boundaries

```
[ Customer / Staff Browser ]
        │  (untrusted input — every request)
        ▼
[ Next.js / tRPC server (Vercel) ]  ◄── webhook boundary ──  [ Azul / CardNet / Twilio ]
        │  (trusted internally, but every write is still validated)
        ▼
[ PostgreSQL (Neon) ]
```

The browser is **never trusted** — not for role claims, not for prices,
not for `branchId` scoping (see `docs/BACKEND_ARCHITECTURE.md` §7's
enforcement pattern). The webhook boundary is **never trusted without
signature verification** (§6.5). Everything inside the server boundary is
still subject to least-privilege database roles (§7) — an internal bug is
not assumed harmless just because it's "our own code."

### 3.4 Primary Attack Surfaces

1. Public storefront and checkout (unauthenticated, highest exposure).
2. Login/authentication endpoints (credential stuffing, brute force).
3. `/admin` and staff-facing surfaces (highest-value target if compromised).
4. Payment and fiscal webhooks (forged "payment succeeded" is the single
   highest-impact spoofing risk in this system).
5. Third-party dependencies (supply-chain risk, §8).

---

## 4. Identity and Access Management

### 4.1 Authentication

- Authentication MUST use Auth.js per `docs/BACKEND_ARCHITECTURE.md` §6.
  A future authentication-provider change MUST preserve every requirement
  in this section regardless of vendor.
- Password storage (credentials fallback path) MUST use `argon2`. MUST
  NOT use a faster/weaker hash "for now."
- Customer sessions use JWT; staff sessions MUST use database-backed,
  individually revocable sessions (`docs/BACKEND_ARCHITECTURE.md` §6, §16.4).

### 4.2 Multi-Factor Authentication

- MFA (TOTP) is **mandatory**, not optional, for `finance`, `ops_manager`,
  and `admin` roles (`docs/BACKEND_ARCHITECTURE.md` §16.3). An account in
  one of these roles without MFA enrolled MUST be blocked from completing
  login, not merely warned. `branch_manager` is intentionally excluded
  from this minimum — its access is single-branch-scoped, not
  cross-branch — see `docs/BACKEND_ARCHITECTURE.md` §16.3 for the full
  rationale and the explicit note that this bar SHOULD be lowered for
  deployments where a single branch's exposure is itself significant.
- SMS-based MFA MUST NOT be used for these roles (SIM-swap risk).
- Recovery codes MUST be stored hashed, single-use.

### 4.3 Authorization (RBAC)

- Every role and its access is defined in `docs/BACKEND_ARCHITECTURE.md`
  §7. This document adds one binding rule on top of that table:
  **authorization is enforced exclusively server-side, in tRPC middleware.
  A client-side role check MUST NEVER be the sole gate on any action or
  data access.**
- Role-to-procedure mappings MUST be additive (start at zero access, grant
  explicitly) — MUST NOT be built by copying `admin` and removing access.
- Branch-scoped roles MUST have their `branchId` derived from the
  authenticated session server-side, never accepted as a client-supplied
  parameter for scoping purposes.

### 4.4 Session Management

- Staff sessions MUST support explicit, immediate revocation by an admin
  (offboarding, suspected compromise).
- Staff sessions MUST enforce an idle timeout. Customer sessions MAY be
  longer-lived given lower per-session sensitivity.
- Every user MUST be able to view and revoke their own active
  sessions/devices.

---

## 5. Data Protection and Classification

### 5.1 Classification

| Class | Examples | Handling requirement |
|---|---|---|
| **Public** | Product catalog, category names | No special handling. |
| **Internal** | Aggregate KPIs, non-customer-identifying operational data | Staff-authenticated access only. |
| **Confidential** | Customer PII, order history, staff records | Encrypted at rest, role-scoped access, never in unscrubbed logs. |
| **Restricted** | Payment metadata, fiscal/NCF records, credentials, secrets | Encrypted at rest, most restrictive role access, audit-logged access, never leaves the system boundary except via a verified, purpose-built integration. |

### 5.2 Rules

- Confidential and Restricted data MUST be encrypted at rest (database
  provider's encryption-at-rest guarantee at minimum) and in transit (TLS
  everywhere — no exceptions for internal calls).
- PII and payment/fiscal data MUST NOT appear in error-tracking tool
  (Sentry) event data by default — PII-scrubbing rules MUST be configured
  before any real customer data flows through the system
  (`docs/BACKEND_ARCHITECTURE.md` §18.6).
- `FiscalReceipt` records MUST be append-only. Corrections are new,
  linked receipts, never mutations of an issued receipt
  (`docs/BACKEND_ARCHITECTURE.md` §3.1, §4) — this is both a security and
  a regulatory requirement.
- `AuditLog` records MUST be append-only at the application layer, and the
  application's runtime database role SHOULD NOT hold `UPDATE`/`DELETE`
  grants on the audit table (§7).
- Raw payment card data MUST NEVER be received, transmitted, or stored by
  this application's own code — see §6.6.

### 5.3 Reconciling PII Deletion with Permanent Fiscal Retention

`FiscalReceipt` and `AuditLog` records MUST be retained permanently
(§5.2) — this is a regulatory requirement, not a design preference — yet
a customer may legitimately request deletion of their PII, and §12
already flags that DR data-protection obligations here need direct legal
confirmation. Those two requirements are not actually in conflict, but
the architecture MUST NOT pretend the tension doesn't exist:

- A customer deletion request MUST anonymize the PII-bearing fields on
  `Customer`/`Address`/`User` (name, phone, address text, geocoded
  coordinates) while leaving `Order`, `Payment`, and `FiscalReceipt`
  financial/fiscal amounts intact under their independent regulatory
  retention requirement.
- `AuditLog` entries referencing a deleted customer's prior actions MUST
  retain the `actorId` and action record — the audit trail's integrity
  MUST NOT be broken by a later deletion request.
- The exact anonymization mechanism (hard-delete PII columns vs.
  cryptographic erasure vs. a dedicated redaction pass) is intentionally
  **not specified** here — this is deferred pending the legal
  confirmation already flagged in §12, consistent with this document's
  practice of not freezing compliance detail ahead of that confirmation.

---

## 6. Application Security Standards

### 6.1 Input Validation

- Every tRPC procedure input and every webhook payload MUST be validated
  through a Zod schema before touching business logic
  (`docs/BACKEND_ARCHITECTURE.md` §8). Compile-time TypeScript types are
  not a substitute — they don't protect against a malformed or malicious
  runtime request.

### 6.2 Injection Prevention

- All database access MUST go through Prisma's parameterized query
  interface. Raw SQL, if ever required, MUST use Prisma's parameterized
  `$queryRaw` tagged-template form — string-concatenated SQL is
  prohibited without exception.

### 6.3 XSS / CSRF

- Rely on Next.js/React's default output escaping; MUST NOT use
  `dangerouslySetInnerHTML` with any data that includes user or
  third-party input without a specific, documented sanitization step.
- tRPC mutations over HTTP POST with same-site cookie defaults provide
  baseline CSRF protection; any endpoint accepting state-changing requests
  outside this pattern (e.g., a future public REST API) MUST implement
  its own CSRF/anti-forgery mechanism.

### 6.4 Security Headers

- Content-Security-Policy, `X-Frame-Options`, and `Referrer-Policy` MUST
  be configured in `next.config.ts` before this application handles real
  customer data — currently absent, flagged as a pre-launch blocker
  (`docs/PROJECT_STATUS.md` pending items, `docs/BACKEND_ARCHITECTURE.md`
  §16.1).

### 6.5 Webhook Verification

- Every webhook handler (Azul, CardNet, Twilio) MUST verify the sender's
  signature before processing the payload. An unverified webhook MUST be
  rejected, not processed defensively.
- Signature verification MUST include timestamp/tolerance-window
  validation where the provider's signature scheme supports it, in
  addition to signature checking — this bounds how long a captured,
  validly-signed webhook remains replayable, which signature checking
  alone does not address.
- Webhook processing MUST be idempotent — a replayed or duplicate webhook
  MUST NOT cause a duplicate side effect (e.g., double-marking an order
  paid, double-dispatching a notification).

### 6.6 Payment Data Handling

- This application MUST use hosted/tokenized checkout for both Azul and
  CardNet. Raw card numbers MUST NEVER be received by this application's
  own servers or components, even temporarily, even for testing
  (`docs/BACKEND_ARCHITECTURE.md` §13.2).
- Order payment status MUST only transition to "paid" via a verified
  provider webhook — never via a client-reported success.
- This handling pattern targets **PCI SAQ-A** scope (the lightest PCI
  self-assessment tier, applicable when card data never touches the
  merchant's own systems) — any future change to the checkout flow MUST
  be evaluated against whether it would expand PCI scope before being
  implemented.

### 6.7 Rate Limiting

- All public, unauthenticated endpoints (login, checkout initiation,
  password reset, magic-link request) MUST be rate-limited per §1.7 of
  `docs/BACKEND_ARCHITECTURE.md`.

---

## 7. Secrets and Credential Management

### 7.1 Rotation Policy

| Credential class | Rotation cadence |
|---|---|
| Payment gateway credentials (Azul, CardNet) | Per provider guidance; immediately on any suspected exposure |
| `AUTH_SECRET` | Quarterly, with documented session-invalidation impact |
| Provider API keys (Twilio, Resend, Sentry, Upstash, Inngest) | Annually at minimum; immediately on team-member offboarding if that person had access |
| Database credentials (application runtime role, migration role) | On any suspected exposure; reviewed at each least-privilege audit (§7.3) |

### 7.2 Storage

- Secrets MUST live in the hosting platform's environment-variable system
  (Vercel) or a dedicated secrets manager once team size warrants one
  (`docs/BACKEND_ARCHITECTURE.md` §16.2) — MUST NEVER be committed to the
  repository, including in `.env.example` (values MUST stay empty) or
  test fixtures.
- No secret MUST ever reach the client bundle. Enforced by the
  `server-only` package on every `server/` module and strict discipline
  around the `NEXT_PUBLIC_` prefix — see `docs/BACKEND_ARCHITECTURE.md`
  §10 for the exact variable list and which single variable is expected
  to carry that prefix.

### 7.3 Least Privilege

- Database roles MUST be separated by function: the application runtime
  role MUST NOT hold `DROP` or schema-altering permissions; migrations
  run under a separate, more privileged role used only in the deploy
  pipeline, never embedded in the running application
  (`docs/BACKEND_ARCHITECTURE.md` §16.9).
- Provider API keys MUST be scoped as narrowly as each provider allows.
- Staff role/access grants (who has `admin`, `finance`, `ops_manager`)
  MUST be reviewed on a recurring cadence (recommended: quarterly) —
  access that's no longer needed MUST be revoked, not left dormant.

---

## 8. Vulnerability and Dependency Management

- Automated dependency update PRs (Dependabot or Renovate) MUST be active
  from the first backend PR onward (`docs/BACKEND_ARCHITECTURE.md` §16.7).
- CI MUST run `npm ci` (not `npm install`) and a dependency vulnerability
  scan (`npm audit` at minimum) before any merge, once CI exists (tracked
  as a pending item across `docs/PROJECT_STATUS.md` and
  `docs/ROADMAP.md`).
- New dependencies, especially anything with install/postinstall scripts
  or broad filesystem/network access, MUST be reviewed before adoption —
  a deliberate five-minute check, not a reflexive `npm install`.

---

## 9. Audit Logging and Monitoring

- Every privileged mutation (role changes, refunds, inventory overrides,
  fiscal receipt corrections, an admin resetting another user's MFA) MUST
  be logged to `AuditLog` with the acting `User`, timestamp, action, and
  a before/after snapshot — attributable to a specific person, never just
  a role (`docs/BACKEND_ARCHITECTURE.md` §16.5).
- Audit logs MUST be retained substantially longer than operational data
  — a multi-year retention window is the baseline expectation for this
  category.
- Error tracking (Sentry) and uptime monitoring on payment webhook
  endpoints specifically are security-relevant monitoring, not just
  reliability monitoring — see `docs/BACKEND_ARCHITECTURE.md` §18 for the
  full observability standard, which this document incorporates by
  reference for security-relevant alerting.

---

## 10. Incident Response

### 10.1 Severity Levels

| Level | Definition | Response expectation |
|---|---|---|
| **Sev1** | Payment/data breach, or full outage | Immediate response, all-hands, incident channel opened |
| **Sev2** | Partial degradation, single-provider outage | Prompt response, tracked to resolution same business day where possible |
| **Sev3** | Non-critical bug, no security/data impact | Normal prioritization |

### 10.2 Roles

- A designated security/incident contact MUST exist at all times, even if
  that's one person at the team's current size — their contact
  information MUST be documented somewhere durable, not tribal knowledge.
- Every Sev1/Sev2 incident MUST produce a written postmortem (root cause,
  what changed as a result), following the same discipline this project
  already applies to `docs/DECISIONS.md`.

### 10.3 Breach Notification

- If customer PII or payment/fiscal metadata is ever exposed, Dominican
  Republic data-protection expectations and affected-customer
  notification obligations MUST be understood **before** an incident, not
  researched during one. This requires a direct legal/compliance check —
  flagged here as required, not resolved by this document (consistent
  with `docs/BACKEND_ARCHITECTURE.md`'s honesty about unconfirmed
  regulatory specifics needing verification at implementation time).

---

## 11. Security Review Cadence

- **Pre-merge:** every PR touching auth, payments, PII, or authorization
  logic MUST be reviewed against the checklist in `CONTRIBUTING.md`,
  which this document extends with: no new endpoint ships without an
  explicit role requirement; no new client-visible data includes PII
  beyond what the feature requires.
- **Pre-launch:** a full security review MUST occur before Phase 6
  (real payments, `docs/BACKEND_ARCHITECTURE.md` §19) goes live — this is
  the single highest-stakes transition in the roadmap and MUST NOT be
  treated as just another sprint. **Internal review (this team applying
  this document end-to-end) is the current standard**, consistent with
  this team's current size and the reduced PCI burden of the SAQ-A
  hosted-checkout scope (§6.6). This determination SHOULD be revisited —
  in favor of an independent external review or penetration test — once
  team size, transaction volume, or PCI scope grows beyond what SAQ-A
  and an internal review can credibly cover.
- **Ongoing:** quarterly access review (§7.3), quarterly dependency audit
  beyond automated PRs, and a re-verification fire-drill of the
  "how would we detect this" path described in
  `docs/BACKEND_ARCHITECTURE.md` §18.7 at least once before go-live.

---

## 12. Compliance Considerations (Dominican Republic)

- **Fiscal compliance (DGII/NCF/ITBIS):** architecture is specified in
  `docs/BACKEND_ARCHITECTURE.md` §3.1 and §13.2. Exact current rates, NCF
  type codes, and e-CF requirements MUST be confirmed against current
  DGII guidance before Phase 6 implementation — this document does not
  freeze tax law, it specifies the architecture that accommodates it.
- **Data protection:** no DR-specific data-residency law is known to
  require local hosting as of the writing of `docs/BACKEND_ARCHITECTURE.md`
  §2 — this MUST be reconfirmed with direct legal review before launch,
  not assumed to remain true indefinitely.
- **Payment compliance:** PCI scope is minimized to SAQ-A via hosted
  checkout (§6.6) — this MUST be validated with the chosen payment
  gateway's own compliance documentation before go-live, not assumed from
  this document alone.

---

## 13. Ownership and Governance

- This document is owned by whoever holds the `admin` role/security
  contact function at any given time (§10.2), and MUST be reviewed at
  the start of each sprint that touches auth, payments, or PII handling.
- Any deviation from a MUST in this document requires a corresponding
  entry in `docs/DECISIONS.md` explaining why, matching the project's
  existing decision-recording discipline — a deviation without a recorded
  reason is treated as a defect, not a judgment call.

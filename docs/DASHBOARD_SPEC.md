# Dashboard Specification

Morel OS's long-term vision (see `PRODUCT_VISION.md`) includes a full suite
of operational dashboards, not just the single ops view built for the
initial demo. This document specs each planned module: its purpose, target
user, key widgets, data it depends on, and current build status. It is a
**living backlog**, not a finished design — expand each section as real
requirements emerge from actual users of each module.

Only **Operations** has any implementation today (`/admin`, built for the
MVP). Every other module below is specification only — nothing has been
built.

---

## 1. Executive Dashboard

**Status:** 📋 Not started

**Purpose:** A single, high-level view for store ownership/leadership —
answers "how is the business doing" without requiring anyone to interpret
the operational detail in other dashboards.

**Target users:** Owners, general managers, regional leadership.

**Planned widgets:**
- Revenue trend (daily/weekly/monthly), with period-over-period comparison
- Order volume trend, same cadence
- Cross-branch comparison (once multi-branch data exists)
- Top-line KPIs: average order value, customer retention rate, delivery
  SLA compliance
- Alerts/exceptions surfaced from other dashboards (e.g. "Inventory:
  3 SKUs out of stock," "Finance: refund rate up 40% this week")

**Depends on:** Real order/revenue data (Sprint 4+), and ideally every
other dashboard module existing first, since this one aggregates them.

---

## 2. Operations (v0 built, full spec pending)

**Status:** 🟡 Partially built — `/admin` (see `app/admin/page.tsx`)

**Purpose:** Real-time visibility into order fulfillment — what's
in-flight, where it's stuck, how the operation is trending.

**Target users:** Branch managers, fulfillment/warehouse staff, ops
coordinators.

**What exists today (v0):**
- 4 KPI cards (orders today, average ticket, average delivery time,
  satisfaction) — currently hardcoded values, not derived from
  `adminOrders` (see `docs/ARCHITECTURE.md`/`docs/PROJECT_STATUS.md`)
- Weekly sales/orders composed chart (Recharts)
- Kanban board of orders grouped by status (Confirmado → Preparando →
  Control de calidad → En camino → Entregado), sourced from
  `data/admin.ts`'s seeded `adminOrders`

**Planned for a full version:**
- Per-branch filtering (data model already has a `branch` field per order,
  unused by any filter today)
- Drag-and-drop status changes on the kanban board (currently read-only,
  links out to `/pedido/[id]` instead)
- SLA breach highlighting (orders stuck in one status too long)
- Real-time updates once backed by a real order source, replacing the
  static seed data

**Depends on:** Real order data + auth (this is the first dashboard that
should get access control, given it already exists and is currently
public — see `docs/ROADMAP.md` Sprint 5).

---

## 3. Inventory

**Status:** 📋 Not started

**Purpose:** Stock visibility and management — what's available, what's
low, what needs reordering, and how substitution patterns (a core product
differentiator — see `PRODUCT_VISION.md`) relate to actual stock-outs.

**Target users:** Branch staff responsible for stocking, category
managers, purchasing.

**Planned widgets:**
- Stock levels per SKU per branch, with low-stock thresholds
- Substitution frequency report — which products get substituted most
  often, cross-referenced with the per-customer "never substitute"
  preference data already captured at checkout
- Reorder suggestions (manual first, AI-assisted later — see
  `docs/ROADMAP.md` Future AI Roadmap)
- Expiry/freshness tracking for perishables (a stated differentiator in
  the "Control de calidad" order stage)

**Depends on:** A real product/inventory data source — today's
`data/catalog.ts` has no stock quantity field at all, only a static
`substitutable` boolean per product.

---

## 4. Customers

**Status:** 📋 Not started

**Purpose:** Understand who's ordering, how often, and how satisfied they
are — the customer-relationship counterpart to Operations' order-fulfillment
view.

**Target users:** Customer service, marketing, general management.

**Planned widgets:**
- Customer list/search with order history
- Repeat-purchase rate, cohort retention
- Substitution preference patterns per customer (ties into Inventory)
- Support/complaint tracking (none exists today — no support channel is
  modeled anywhere in the current app)

**Depends on:** Real user accounts (Sprint 5) — there is currently no
concept of a returning customer; every checkout uses a single hardcoded
demo name.

---

## 5. Marketing

**Status:** 📋 Not started

**Purpose:** Campaign performance and customer acquisition/engagement
tooling.

**Target users:** Marketing team.

**Planned widgets:**
- Promotion/discount performance (no discount mechanism exists in the app
  today — `Product.discountPct` is defined in the type but unused)
- Channel attribution for new customers
- Campaign-linked order tracking

**Depends on:** Customer accounts (Sprint 5) and a real order source
(Sprint 4) at minimum; likely the module with the largest gap between spec
and current app capability.

---

## 6. Finance

**Status:** 📋 Not started

**Purpose:** Financial reporting beyond what Executive needs at a glance —
reconciliation, refunds, payment-provider fees, per-branch P&L inputs.

**Target users:** Finance/accounting staff.

**Planned widgets:**
- Revenue reconciliation against the real payment provider (depends
  entirely on Sprint 6's real payments integration — nothing here is
  possible while checkout is cosmetic)
- Refund/cancellation tracking
- Delivery-fee revenue vs. delivery cost (once real driver/logistics cost
  data exists)

**Depends on:** Real payments (Sprint 6) — this module cannot meaningfully
start before that.

---

## 7. Employees

**Status:** 📋 Not started

**Purpose:** Staff scheduling, performance, and delivery-driver management.

**Target users:** Branch managers, HR.

**Planned widgets:**
- Staff roster per branch/shift
- Driver performance (the app already has a rich mock `Driver` shape in
  `data/orders.ts` — name, vehicle, plate, rating — that could seed this
  module's data model)
- Prep-time performance per staff member/shift (ties into Operations' SLA
  tracking)

**Depends on:** Real staff/scheduling data — nothing today models
individual staff members, only a single mocked driver per order.

---

## 8. AI Operations Center

**Status:** 📋 Not started (directional — see `docs/ROADMAP.md` Future AI
Roadmap)

**Purpose:** Not a dashboard of raw metrics like the others — a
purpose-built surface for AI-generated operational insight: anomalies,
predictions, and recommended actions, pulling from every other module once
they exist.

**Target users:** Ops leadership, anyone who'd otherwise have to manually
correlate signals across Operations, Inventory, and Customers to spot a
problem.

**Planned widgets:**
- Anomaly feed (e.g. "Branch Norte's prep time is 40% above its 30-day
  average")
- Demand forecasts (feeds Inventory reorder suggestions and Employees
  scheduling)
- Substitution-risk predictions (feeds Inventory)
- Natural-language query interface over operational data

**Depends on:** Every other dashboard module having real data first — this
is explicitly the last module to build, not the first, despite being the
most novel. Building it against mock data would produce insights with no
real value and would need to be rebuilt entirely once real data exists
(the same lesson as `hooks/use-order-progress.ts` — see
`docs/DECISIONS.md`).

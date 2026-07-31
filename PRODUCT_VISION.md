# Product Vision — Morel OS

## What Morel OS Is

Morel OS is the proposed digital operating system for **Supermercados
Morel**, an Argentine/LatAm supermarket chain. It's not a single feature —
it's meant to be the connective layer between three things that, in most
retail businesses, live in disconnected systems: **online ordering**,
**live delivery tracking**, and **store/company operations**. The name
"OS" is deliberate: the goal is a unified operating system for the
business, not a bolt-on ecommerce widget.

The current codebase implements the customer-facing half of that vision
(storefront, checkout, live tracking) plus the first module of the
operations half (a v0 ops dashboard) — see `docs/PROJECT_STATUS.md` for
exactly what's built versus planned.

## Product Vision

A customer should be able to order their weekly groceries online with the
same confidence they'd have picking items off the shelf themselves —
knowing exactly what will happen if something's out of stock, watching
their order move from "confirmed" to "at your door" in real time, with no
guesswork. Store operations, meanwhile, should run on the same platform
the customer sees — not a disconnected back-office tool bolted on
afterward — so that what a customer experiences and what staff manage are
two views of one system, not two systems that have to be kept in sync by
hand.

## Mission

Give Supermercados Morel a digital experience that feels like it was built
by a well-funded, product-led company — not a supermarket's first attempt
at "getting online" — while giving the operations team the tooling to
actually run the business behind it, without needing a separate vendor or
system for each function (ordering, tracking, inventory, staffing,
finance).

## Target Users

1. **Shoppers** — the primary customer-facing audience. People doing their
   regular grocery shop online, who care about speed, trust (will my order
   actually be right?), and not having to think about the technology at
   all.
2. **Store/branch operations staff** — the people fulfilling orders day to
   day: picking, quality control, dispatch. Need fast, clear, low-friction
   tooling, not a dashboard designed for executives.
3. **Delivery drivers** — currently represented only as mock data in the
   customer-facing tracking experience; a driver-facing surface is not yet
   in scope but is an implied future user once real logistics exist.
4. **Branch managers and ops leadership** — need visibility across orders,
   staffing, and performance without digging through raw data.
5. **Company leadership/ownership** — need the highest-level view: is the
   business healthy, growing, and where are the exceptions that need
   attention. (See `docs/DASHBOARD_SPEC.md`'s Executive Dashboard.)

## Design Principles

These are the principles the existing UI was built against, and should
continue to guide anything added:

- **Trust through transparency, not defaults.** The clearest expression of
  this today is the per-item "nunca sustituir" (never substitute)
  preference at checkout — instead of a blanket "no substitutions" policy
  or silent auto-substitution, the customer decides product-by-product.
  Every future feature should ask the same question: does this give the
  user real control, or just the appearance of it?
- **Feel like a funded, live product — not a prototype.** No lorem ipsum,
  no placeholder states that look unfinished, no loading spinners that
  hang. Realistic data, smooth motion, real copy, in Argentine/LatAm
  Spanish throughout.
- **Speed and clarity over feature density.** The storefront, checkout,
  and tracking flows are each a handful of clear steps, not a maze of
  options. Operations dashboards should follow the same instinct — surface
  what matters, don't just expose every field that exists.
- **Mobile-first, but not mobile-only.** The customer-facing flows are
  designed to work cleanly from 375px up through desktop; operations
  dashboards can lean more toward desktop given their actual usage
  context, but should never break on a tablet in a warehouse.
- **Spanish-first, LatAm-specific.** Not a translated English product —
  currency formatting (ARS), delivery-slot phrasing, product naming, and
  tone are all built for the actual market from the start, not localized
  after the fact.

## Long-Term Vision

Morel OS's long-term shape is a **multi-branch, AI-augmented retail
operating system**: one platform where a customer's ordering experience,
a branch's fulfillment operations, and company-wide visibility (finance,
inventory, staffing, marketing) all run on the same data, not
reconciled between separate tools after the fact. The dashboard suite
specced in `docs/DASHBOARD_SPEC.md` — Executive, Operations, Inventory,
Customers, Marketing, Finance, Employees, and eventually an AI Operations
Center — is the operational half of that vision, built out module by
module as the underlying data and backend mature (see `docs/ROADMAP.md`).

AI is intentionally a **later** layer, not a first one: the plan is to
build real operational data first (real orders, real inventory, real
staffing) and only then layer AI-assisted insight and automation on top of
it — anomaly detection, demand forecasting, smarter substitution
suggestions — rather than building AI features against mock data that
would need to be rebuilt once real data exists.

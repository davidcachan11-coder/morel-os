# Architecture

This document describes how Morel OS is put together as of `production-v1`
(post–Sprint 1: Project Foundation). It is a living document — update it
whenever the architecture changes, not just when someone asks for it.

## 1. Overview

Morel OS is a **Next.js 16 App Router** application, written in strict
TypeScript, with **no backend** — every piece of data (products, orders,
delivery slots, admin metrics) is either a static mock dataset shipped with
the app or state persisted client-side in `localStorage`. This is a
deliberate, current-phase constraint (see `docs/DECISIONS.md`), not a
limitation of the architecture itself: the app is layered so that a real
backend can be introduced one module at a time without a rewrite.

Rendering is a mix of Server Components (the default for every route's
top-level `page.tsx`) and Client Components (anything interactive: the
product grid, the checkout wizard, the cart drawer, the live tracking view).
Next.js's automatic per-route code splitting means heavy client-only
dependencies (Recharts, the checkout wizard) never ship to routes that don't
use them.

## 2. Folder Structure

```
app/                  Routes only (App Router file conventions)
├── layout.tsx         Root layout — fonts, header, cart drawer, toaster
├── page.tsx            "/"            — landing page
├── admin/page.tsx      "/admin"       — ops dashboard
├── pedido/[id]/page.tsx "/pedido/[id]" — live order tracking
└── tienda/
    ├── page.tsx         "/tienda"          — product catalog
    └── checkout/page.tsx "/tienda/checkout" — checkout wizard

components/            UI, organized by scope
├── ui/                 shadcn/ui primitives (generated, not hand-edited)
├── admin/               feature components for /admin
├── landing/              feature components for /
├── pedido/                feature components for /pedido/[id]
├── tienda/                 feature components for /tienda*
├── motion/                  cross-cutting animation helpers
└── *.tsx                     global components (header, footer, cart drawer, logo)

config/                Structured, composed app configuration
├── brand.ts             Name, tagline, description, brand color references
├── theme.ts              Light-mode-only theme metadata (radius, fonts, shadows)
├── navigation.ts           Primary + footer nav link definitions
├── settings.ts               Locale, currency, delivery fee, storage keys
├── features.ts                 Feature-flag documentation of current capabilities
└── seo.ts                       Default metadata values

constants/              Primitive, literal values with no structure
├── pricing.ts            DELIVERY_FEE
└── storage.ts             localStorage key names

data/                   Domain data + the types that describe it
├── catalog.ts            Product, Category types + product/category data
├── delivery.ts             DeliverySlot type + delivery slot data
├── orders.ts                 Order-status vocabulary, driver, demo order builder
└── admin.ts                    Admin dashboard seed data (orders, weekly sales)

hooks/                  Custom React hooks
└── use-order-progress.ts  Derives live order status from a timestamp

lib/                    Cross-cutting utilities and client state
├── cart-store.ts         Zustand cart store (persisted)
└── utils.ts               cn(), formatCurrency(), formatQuantity()

services/               Runtime read/write access to persisted data
└── orders.ts              localStorage-backed order repository

providers/              (scaffolded, empty) — reserved for React context
                         providers once one is needed (none exist yet)

types/                  (scaffolded, empty) — reserved for types that need
                         to be shared across multiple data/ domains

public/                 Static assets served at the root URL
```

**Why this split exists:** before Sprint 1, all of `data/`'s content lived
in one 338-line `lib/mock-data.ts` file mixing six unrelated domains, and
`hooks/`/`services/` had no folder even though `components.json` already
declared a `@/hooks` alias. The split makes each domain independently
editable and gives every future backend integration a single, obvious file
to swap out (see §7).

## 3. Data Flow

There is no client → server → database round trip anywhere in this app.
Every "data flow" is client-side state derived from one of three sources:

```
data/*.ts (static)  ──┐
                       ├──▶ React components (read-only, imported directly)
constants/, config/ ──┘

lib/cart-store.ts (Zustand + localStorage)
   addItem() / setQuantity() / toggleNeverSubstitute()
        │
        ▼
   components read via useCartStore(selector) — reactive, re-renders on change

services/orders.ts (plain localStorage read/write, not reactive)
   saveOrder() on checkout confirmation
        │
        ▼
   getOrder(id) on /pedido/[id] mount, via a client-side loader
   component (falls back to data/orders.ts's buildDemoOrder()
   if the id isn't found — see docs/DECISIONS.md)

hooks/use-order-progress.ts
   Given an order's createdAt timestamp, derives the current status,
   ETA, and map position purely from Date.now() — no stored "status"
   field exists anywhere. Re-computed every second via setInterval.
```

**Concretely, a full user journey:**

1. `/tienda` reads `products`/`categories` directly from `data/catalog.ts` (no fetch — it's a static import, resolved at build time).
2. Adding a product calls `useCartStore().addItem(product)`, which updates the Zustand store and persists it to `localStorage["morel-os:cart"]`.
3. `/tienda/checkout` reads the cart via `useCartStore`, walks a 4-step local `useState` wizard, and on "Pagar" builds a `StoredOrder` object and calls `services/orders.ts`'s `saveOrder()`, which writes it to `localStorage["morel-os:orders"]`, then clears the cart.
4. Navigating to `/pedido/[id]` mounts `OrderTrackerLoader`, which calls `services/orders.ts`'s `getOrder(id)` on the client (falling back to `data/orders.ts`'s `buildDemoOrder(id)` if not found) and passes the result to `OrderTracker`.
5. `OrderTracker` calls `hooks/use-order-progress.ts`'s `useOrderProgress(order.createdAt)`, which ticks every second and derives status/ETA/map position from elapsed wall-clock time — this is what makes the tracking page "animate itself" without any server pushing updates.

## 4. State Management

Three distinct mechanisms coexist, each appropriate to what it manages:

| Mechanism | Owns | Reactive? | Persisted? |
|---|---|---|---|
| `lib/cart-store.ts` (Zustand + `persist`) | Cart line items, drawer open state, selected slot | Yes — components subscribe via selectors | Yes, via `zustand/middleware`'s `persist` (`partialize`d to exclude UI-only state) |
| `services/orders.ts` (plain `localStorage`) | Placed orders | No — must be manually re-read (`useEffect` on mount) | Yes, hand-rolled JSON blob |
| Local component `useState` | Checkout wizard step/form fields, tienda search/filter | Yes, scoped to the component | No — intentionally ephemeral |

There is **no global "order status" store** — `useOrderProgress` derives status
from time on every tick rather than reading a stored value. This is a
deliberate demo-only trick (see `docs/DECISIONS.md`) that will need to be
replaced, not extended, once real backend-pushed status exists.

## 5. Services

`services/` currently holds one module: `services/orders.ts`. It exposes a
small, synchronous, `localStorage`-backed API:

```ts
saveOrder(order: StoredOrder): void
getOrder(id: string): StoredOrder | null
generateOrderId(): string
```

This is intentionally shaped like a repository interface (get/save/generate)
so that swapping the implementation for a real API client later means
rewriting this one file, not every component that calls it.

## 6. Hooks

`hooks/` currently holds one custom hook: `useOrderProgress(createdAt)`
(`hooks/use-order-progress.ts`). It's a pure derivation — given a timestamp,
it returns the current order stage, progress within that stage, an ETA in
minutes, and a 0–1 driver-position value for the live map, re-computed every
second via `setInterval`. It has no side effects beyond its own timer and
owns no persisted state.

## 7. Config

Two related but distinct layers, introduced in Sprint 1:

- **`constants/`** — primitive literal values with no structure or
  composition (`DELIVERY_FEE`, `STORAGE_KEYS`). These are the actual source
  of truth, consumed **directly** by `data/orders.ts`, `lib/cart-store.ts`,
  `services/orders.ts`, and `components/tienda/checkout-summary.tsx`.
- **`config/`** — structured, higher-level configuration objects
  (`brand`, `theme`, `navigation`, `settings`, `features`, `seo`) that
  describe the app's identity and behavior. `config/settings.ts` composes
  values from `constants/` (locale, currency, and re-exports of
  `DELIVERY_FEE`/`STORAGE_KEYS`). As of Sprint 1, only `lib/utils.ts`
  actually imports `config/settings.ts` — for the `locale`/`currency`
  passed to `formatCurrency`/`formatQuantity`. `brand.ts`, `theme.ts`,
  `navigation.ts`, `features.ts`, and `seo.ts` are **populated but not
  imported anywhere yet**; they document current values as a foundation
  for a future sprint to migrate consumers onto, without having touched
  any UI-facing code in this pass.

## 8. Future Architecture Vision

**This section's direction is now the approved design in
`docs/BACKEND_ARCHITECTURE.md`** — that document is authoritative for
specifics (e.g., the API layer is tRPC + Route Handlers under a new
`server/` folder, not a generic "BFF layer"; the migration is phased in
`docs/BACKEND_ARCHITECTURE.md` §19). The predictions below predate that
design and remain directionally correct; where the two differ on detail,
`docs/BACKEND_ARCHITECTURE.md` wins.

The current architecture is deliberately shaped like the "front half" of a
real system — types, boundaries, and folder structure are already where
they'd need to be — with the "back half" (persistence authority, auth,
real-time updates) intentionally deferred. The expected evolution:

- **`services/` gains real API adapters.** Each service module keeps its
  current function signature (`getOrder`, `saveOrder`, …) but its
  implementation moves from `localStorage` to `fetch` calls against a real
  backend. Components should not need to change.
- **`app/api/` appears** for either a thin BFF layer or full route handlers,
  once there's a real datastore.
- **`providers/` gets its first real entry** — an auth/session provider,
  and likely a data-fetching provider (React Query/SWR) once requests are
  async and need caching/retry semantics beyond a synchronous `localStorage`
  read.
- **`hooks/use-order-progress.ts` is replaced, not extended**, by a hook
  that subscribes to real server-pushed order status (e.g. via polling or a
  WebSocket) instead of deriving it from a timestamp.
- **`types/` starts holding cross-domain types** (e.g. a shared `Address`
  or `Money` type) once more than one `data/` domain needs the same shape.
- **`/admin` gains real authentication** before any of this is live — see
  `docs/DECISIONS.md` for why this is flagged as a blocking gap, not a
  nice-to-have.

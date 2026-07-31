import "server-only";

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { publicProcedure, router } from "@/server/trpc/trpc";
import { DELIVERY_FEE } from "@/constants/pricing";

// ---------------------------------------------------------------------------
// saveOrder input
// ---------------------------------------------------------------------------

const guestCustomerInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
});

const orderItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive().max(1000),
  neverSubstitute: z.boolean().default(false),
});

const saveOrderInput = z.object({
  customer: guestCustomerInput,
  deliverySlotId: z.string().min(1),
  address: z.string().min(1),
  items: z.array(orderItemInput).min(1).max(100),
  // Required, client-supplied — see docs/DECISIONS.md's idempotency entry.
  // The client is responsible for generating and persisting this across a
  // page refresh (lib/checkout-store.ts, added alongside the real checkout
  // UI); this procedure only enforces and honors it.
  idempotencyKey: z.string().uuid(),
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  // Digits only, for reliable comparison — full E.164/carrier-format
  // validation is a deliberately deferred future refinement, not decided.
  return phone.replace(/\D/g, "");
}

// Must exactly match the CREATE SEQUENCE statement in
// prisma/migrations/20260731180628_branch_default_and_order_number/migration.sql.
// Deliberately not a Prisma model field — see docs/DECISIONS.md's order-id
// entry: a sequence tied to a selectable column would appear in every
// generated Order type, one unguarded findMany() away from leaking
// order-volume/rate as a side effect.
const ORDER_NUMBER_SEQUENCE = "order_number_seq";

/**
 * Read-only, customer-facing orders + guest checkout.
 *
 * Deliberately no "list orders for a customer" procedure: without a real
 * session (Sprint 5), there is no safe way to scope such a query to "the
 * caller's own orders." getOrder(id) is safe to expose unauthenticated
 * because it matches the app's existing behavior today: /pedido/[id] is
 * already a public, unauthenticated tracking link.
 *
 * saveOrder implements the approved guest-checkout architecture — see
 * docs/DECISIONS.md's customer-resolution and order-id entries:
 *
 * - Customer resolution is keyed on email ONLY (the sole DB-enforced-unique
 *   signal). Phone is captured, stored, and indexed (User @@index([phone]))
 *   but never used to merge/reuse an existing Customer — a shared/family
 *   phone number is a plausible benign explanation, and merging on it risks
 *   attaching one person's order history to someone else. If a checkout's
 *   phone matches an existing, DIFFERENT email's account, that's logged as
 *   a possible-duplicate signal for future reconciliation tooling (Sprint
 *   9+ CRM), never auto-merged.
 * - Returning customers (matched by email) never have their stored
 *   name/phone overwritten by a fresh checkout — an unauthenticated
 *   submission is not proof of account ownership. A verified update path
 *   is Sprint 5's authenticated profile-edit, not this procedure. The
 *   upsert's `update: {}` was verified (against a real, if temporary,
 *   SQLite database with query logging — not just assumed) to perform no
 *   write at all when the row already exists. Postgres's exact upsert
 *   compilation couldn't be verified the same way in this environment, so
 *   a P2002 (unique constraint) catch below re-fetches by email instead of
 *   failing the checkout if a concurrent request wins the same race —
 *   correct regardless of that internal detail.
 * - Branch is discovered from the database (Branch.isDefault), not from
 *   external config — no selection/assignment logic, saveOrder only reads
 *   and validates. Morel is single-location today; a Branch Assignment
 *   Service is a separate future evolution that resolves a branchId and
 *   hands it to saveOrder the same way this query does now. A partial
 *   unique index guarantees at most one Branch row can be the default, and
 *   doubles as this query's lookup index.
 * - subtotal/deliveryFee/total are computed server-side from authoritative
 *   Product.price — never accepted from the client — and entirely in
 *   Prisma.Decimal arithmetic, never converted to a plain JS number. Prisma
 *   returns Decimal columns as Decimal instances specifically to avoid
 *   floating-point money errors; converting back to `number` before
 *   summing would reintroduce exactly that, and compounds with cart size.
 * - orderNumber is generated from a standalone Postgres sequence
 *   (order_number_seq — not a Prisma model field), pre-fetched immediately
 *   before the single create() call — after every step that can
 *   realistically fail (branch/slot/product validation), so a doomed
 *   transaction only rarely burns a sequence value. Sequences are
 *   non-transactional by design, so occasional gaps in orderNumber are
 *   expected and harmless (a display number, not an audited count) — the
 *   same property every sequence-based invoice/order numbering scheme has.
 * - Everything (customer resolution, validation, order/items/status-event
 *   creation) happens inside one transaction — no partial writes possible.
 * - idempotencyKey (Sprint 4) is checked first, before any other work: a
 *   repeat submission with the same key returns the original result
 *   unchanged rather than creating a second order. A concurrent race on
 *   the same key is caught via the column's unique constraint (P2002) —
 *   deliberately NOT caught inside the transaction the way the email
 *   upsert's race is above. Once any statement inside a Postgres
 *   transaction fails, that transaction is aborted at the session level;
 *   every later statement on the same connection fails too, until a real
 *   ROLLBACK happens. Prisma does not add savepoints around individual
 *   interactive-transaction calls, so catching create()'s P2002 and then
 *   issuing more tx.* queries wouldn't reliably run them. Instead the
 *   error is left to propagate out of $transaction() uncaught, so Prisma
 *   performs a real rollback — cleanly undoing the capacity decrement
 *   below (and this losing request's own email upsert, if it was a new
 *   customer) — and the winning order is re-fetched with a fresh query
 *   after the transaction is gone, in the mutation's outer catch.
 * - deliverySlot capacity (Sprint 4) is enforced via an atomic conditional
 *   decrement (`UPDATE ... WHERE spotsLeft > 0`), not a read-then-write —
 *   the existing slot-existence check above only confirms the slot is
 *   real, it does not confirm capacity remains.
 */
export const ordersRouter = router({
  getOrder: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return ctx.prisma.order.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          address: true,
          subtotal: true,
          deliveryFee: true,
          total: true,
          deliverySlot: {
            select: {
              id: true,
              dayLabel: true,
              dateLabel: true,
              timeRange: true,
              express: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              neverSubstitute: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  price: true,
                  emoji: true,
                  gradient: true,
                },
              },
            },
          },
          statusEvents: {
            orderBy: { createdAt: "asc" },
            select: {
              status: true,
              createdAt: true,
            },
          },
        },
      });
    }),

  saveOrder: publicProcedure
    .input(saveOrderInput)
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = normalizeEmail(input.customer.email);
      const normalizedPhone = normalizePhone(input.customer.phone);

      try {
        return await ctx.prisma.$transaction(async (tx) => {
          // Checked first, before any other work: a repeat submission with
          // the same key returns the original result unchanged instead of
          // creating a second order or re-decrementing slot capacity.
          const existingOrder = await tx.order.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            select: { id: true, orderNumber: true, createdAt: true },
          });
          if (existingOrder) {
            return existingOrder;
          }

          // Discovered from the database, not external config — saveOrder's
          // only responsibility here is retrieving the default branch and
          // validating it exists. No selection/assignment logic.
          const branch = await tx.branch.findFirst({
            where: { isDefault: true },
          });
          if (!branch) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "No branch is marked as the default branch.",
            });
          }

          const slot = await tx.deliverySlot.findUnique({
            where: { id: input.deliverySlotId },
          });
          if (!slot) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Unknown delivery slot.",
            });
          }

          // Atomic conditional decrement, not read-then-write: the WHERE
          // clause and the decrement happen in the same statement, so two
          // concurrent requests against the last remaining spot can't both
          // read spotsLeft=1 and both succeed. `count === 0` means the
          // slot has no capacity left, since the existence check above
          // already confirmed the row is real. If order.create() below
          // fails (e.g. an idempotencyKey race), this decrement is undone
          // by the transaction's own rollback — see the outer catch.
          const capacityUpdate = await tx.deliverySlot.updateMany({
            where: { id: slot.id, spotsLeft: { gt: 0 } },
            data: { spotsLeft: { decrement: 1 } },
          });
          if (capacityUpdate.count === 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Selected delivery slot is full.",
            });
          }

          const productIds = [...new Set(input.items.map((item) => item.productId))];
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
          });
          if (products.length !== productIds.length) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "One or more products not found.",
            });
          }
          const productById = new Map(products.map((p) => [p.id, p]));

          // Decimal arithmetic throughout — product.price is already a
          // Prisma.Decimal (that's how Prisma returns Decimal columns,
          // specifically to avoid this class of bug). Converting to `number`
          // and summing in floating point would reintroduce the exact
          // problem Decimal columns exist to prevent, and the error compounds
          // with cart size.
          const subtotal = input.items.reduce(
            (sum, item) =>
              sum.plus(productById.get(item.productId)!.price.times(item.quantity)),
            new Prisma.Decimal(0)
          );
          const deliveryFee = new Prisma.Decimal(DELIVERY_FEE);
          const total = subtotal.plus(deliveryFee);

          // Possible-duplicate signal only — never a merge decision. Only
          // checked when email doesn't already resolve to an existing
          // account, since email match is itself conclusive. User.phone is
          // indexed (@@index([phone])) so this isn't a full table scan.
          const existingByEmail = await tx.user.findUnique({
            where: { email: normalizedEmail },
          });
          if (!existingByEmail) {
            const phoneMatches = await tx.user.findMany({
              where: { phone: normalizedPhone },
              select: { id: true },
            });
            if (phoneMatches.length > 0) {
              console.warn(
                JSON.stringify({
                  event: "possible_duplicate_customer",
                  requestId: ctx.requestId,
                  newEmail: normalizedEmail,
                  matchedExistingUserIds: phoneMatches.map((u) => u.id),
                })
              );
            }
          }

          // Email is the only merge key. An empty `update` means an existing
          // user's stored name/phone is never overwritten by this
          // unauthenticated submission. If a concurrent request wins the
          // same race on this email (P2002 on the unique constraint), that
          // means it already committed the row — re-fetch and proceed with
          // it rather than failing this checkout.
          let user;
          try {
            user = await tx.user.upsert({
              where: { email: normalizedEmail },
              create: {
                email: normalizedEmail,
                name: input.customer.name,
                phone: normalizedPhone,
                role: "CUSTOMER",
                customer: { create: {} },
              },
              update: {},
              include: { customer: true },
            });
          } catch (error) {
            const isEmailRace =
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002" &&
              (error.meta?.target as string[] | undefined)?.includes("email");
            if (!isEmailRace) {
              throw error;
            }
            user = await tx.user.findUniqueOrThrow({
              where: { email: normalizedEmail },
              include: { customer: true },
            });
          }
          const customerId = user.customer!.id;

          // order_number_seq is a standalone Postgres sequence (see this
          // migration), deliberately not a Prisma field — see the header
          // comment above and docs/DECISIONS.md's order-id entry. Embedded
          // via Prisma.raw as trusted, hardcoded SQL text (a module-level
          // constant, never derived from request input) rather than a bound
          // parameter, avoiding any ambiguity in how Postgres resolves the
          // parameter's type against nextval's regclass argument.
          const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`
            SELECT nextval(${Prisma.raw(`'${ORDER_NUMBER_SEQUENCE}'`)})
          `;
          const orderNumber = `MO-${nextval.toString().padStart(6, "0")}`;

          // No try/catch here — see the header comment above for why a
          // P2002 on idempotencyKey is deliberately left to propagate
          // uncaught, rather than caught-and-recovered on this same tx.
          const order = await tx.order.create({
            data: {
              orderNumber,
              idempotencyKey: input.idempotencyKey,
              customerId,
              branchId: branch.id,
              deliverySlotId: slot.id,
              address: input.address,
              subtotal,
              deliveryFee,
              total,
            },
          });

          await tx.orderItem.createMany({
            data: input.items.map((item) => ({
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              neverSubstitute: item.neverSubstitute,
            })),
          });

          await tx.orderStatusEvent.create({
            data: { orderId: order.id, status: "CONFIRMADO" },
          });

          return {
            id: order.id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
          };
        });
      } catch (error) {
        const isIdempotencyRace =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          (error.meta?.target as string[] | undefined)?.includes(
            "idempotencyKey"
          );
        if (!isIdempotencyRace) {
          throw error;
        }
        // The whole transaction above — including this request's own
        // capacity decrement, and its own email upsert if this was a new
        // customer — was already rolled back by Postgres the moment
        // order.create() failed; a concurrent request with the same key
        // committed first. tx is gone, so this is a fresh query on
        // ctx.prisma, not a continuation of the dead transaction.
        return ctx.prisma.order.findUniqueOrThrow({
          where: { idempotencyKey: input.idempotencyKey },
          select: { id: true, orderNumber: true, createdAt: true },
        });
      }
    }),
});

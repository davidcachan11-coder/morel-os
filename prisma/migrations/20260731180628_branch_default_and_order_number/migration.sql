-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderNumber" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- Partial unique index: at most one Branch may have isDefault = true.
-- Prisma's schema DSL has no syntax for a conditional/partial unique
-- constraint, so this is hand-authored as part of composing this
-- migration (not an edit to an already-generated file) — see
-- docs/DECISIONS.md's "saveOrder stays in Sprint 3" entry. This index
-- also serves as the lookup index for saveOrder's
-- `WHERE "isDefault" = true` query — no separate index needed for that.
CREATE UNIQUE INDEX "Branch_isDefault_unique_when_true" ON "Branch" ("isDefault") WHERE "isDefault" = true;

-- Standalone sequence for Order.orderNumber generation, deliberately NOT
-- tied to any Order column (no SERIAL/GENERATED ALWAYS AS IDENTITY). A
-- sequence attached to a selectable Prisma field would appear in every
-- generated Order type — one unguarded findMany() away from leaking
-- order-volume/rate. Referenced directly by name (nextval('order_number_seq'))
-- from ordersRouter.saveOrder — see docs/DECISIONS.md's order-id entry.
CREATE SEQUENCE "order_number_seq";

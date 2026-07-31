-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT;

-- Backfill: any row written before this migration (e.g. by prisma/seed.ts
-- under the old schema) predates this column and would otherwise be NULL.
-- Generate a distinct key per row so the NOT NULL constraint below can be
-- applied safely regardless of whether the target database already has
-- data. Real orders from ordersRouter.saveOrder always supply their own
-- key at insert time; this UPDATE only ever touches pre-existing rows.
UPDATE "Order" SET "idempotencyKey" = gen_random_uuid()::text WHERE "idempotencyKey" IS NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "idempotencyKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

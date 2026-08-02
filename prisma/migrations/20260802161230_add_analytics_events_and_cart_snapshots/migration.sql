-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'CATEGORY_VIEW', 'PRODUCT_VIEW', 'PRODUCT_INTERACTION', 'SEARCH', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'CHECKOUT_STARTED', 'PURCHASE_COMPLETED');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT,
    "path" TEXT,
    "categoryId" TEXT,
    "productId" TEXT,
    "searchQuery" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartSnapshot" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "customerId" TEXT,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recoveredAt" TIMESTAMP(3),
    "recoveredOrderId" TEXT,

    CONSTRAINT "CartSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_customerId_idx" ON "AnalyticsEvent"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CartSnapshot_visitorId_key" ON "CartSnapshot"("visitorId");

-- CreateIndex
CREATE INDEX "CartSnapshot_customerId_idx" ON "CartSnapshot"("customerId");

-- CreateIndex
CREATE INDEX "CartSnapshot_updatedAt_idx" ON "CartSnapshot"("updatedAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartSnapshot" ADD CONSTRAINT "CartSnapshot_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropTable
DROP TABLE "PortfolioConfig";

-- CreateTable
CREATE TABLE "CapitalFlow" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "fiatAmount" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "assetAmount" DOUBLE PRECISION NOT NULL,
    "counterparty" TEXT,
    "status" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CapitalFlow_orderId_key" ON "CapitalFlow"("orderId");

-- CreateIndex
CREATE INDEX "CapitalFlow_occurredAt_idx" ON "CapitalFlow"("occurredAt");

-- CreateIndex
CREATE INDEX "CapitalFlow_status_idx" ON "CapitalFlow"("status");

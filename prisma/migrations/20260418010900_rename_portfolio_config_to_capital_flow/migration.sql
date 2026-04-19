-- CreateTable
CREATE TABLE "money_flow" (
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

    CONSTRAINT "money_flow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "money_flow_orderId_key" ON "money_flow"("orderId");

-- CreateIndex
CREATE INDEX "money_flow_occurredAt_idx" ON "money_flow"("occurredAt");

-- CreateIndex
CREATE INDEX "money_flow_status_idx" ON "money_flow"("status");

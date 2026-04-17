-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "portfolioItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionLog_portfolioItemId_idx" ON "TransactionLog"("portfolioItemId");

-- CreateIndex
CREATE INDEX "TransactionLog_occurredAt_idx" ON "TransactionLog"("occurredAt");

-- AddForeignKey
ALTER TABLE "TransactionLog" ADD CONSTRAINT "TransactionLog_portfolioItemId_fkey" FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

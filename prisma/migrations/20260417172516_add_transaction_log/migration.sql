-- CreateTable
CREATE TABLE "transaction_log" (
    "id" TEXT NOT NULL,
    "cryptoItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_log_cryptoItemId_idx" ON "transaction_log"("cryptoItemId");

-- CreateIndex
CREATE INDEX "transaction_log_occurredAt_idx" ON "transaction_log"("occurredAt");

-- AddForeignKey
ALTER TABLE "transaction_log" ADD CONSTRAINT "transaction_log_cryptoItemId_fkey" FOREIGN KEY ("cryptoItemId") REFERENCES "crypto_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

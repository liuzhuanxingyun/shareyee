-- CreateTable
CREATE TABLE "crypto_item" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "shares" DOUBLE PRECISION,
    "contractAddress" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_rarity_config" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_rarity_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "rarityName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pnl_history" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION,
    "totalMarketValue" DOUBLE PRECISION,
    "totalPnl" DOUBLE PRECISION,
    "totalPnlPct" DOUBLE PRECISION,
    "totalPnlCny" DOUBLE PRECISION,
    "forexRate" DOUBLE PRECISION,
    "win" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pnl_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crypto_item_ticker_idx" ON "crypto_item"("ticker");

-- CreateIndex
CREATE INDEX "crypto_item_enabled_idx" ON "crypto_item"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "card_rarity_config_name_key" ON "card_rarity_config"("name");

-- CreateIndex
CREATE INDEX "card_item_rarityName_idx" ON "card_item"("rarityName");

-- CreateIndex
CREATE UNIQUE INDEX "pnl_history_date_key" ON "pnl_history"("date");

-- CreateIndex
CREATE INDEX "pnl_history_date_idx" ON "pnl_history"("date");

-- CreateIndex
CREATE INDEX "pnl_history_recordedAt_idx" ON "pnl_history"("recordedAt");

-- AddForeignKey
ALTER TABLE "card_item" ADD CONSTRAINT "card_item_rarityName_fkey" FOREIGN KEY ("rarityName") REFERENCES "card_rarity_config"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

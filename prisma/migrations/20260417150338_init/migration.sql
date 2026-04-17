-- CreateTable
CREATE TABLE "PortfolioConfig" (
    "id" TEXT NOT NULL,
    "capitalRmb" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
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

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RarityConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RarityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "rarityName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PnlHistory" (
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

    CONSTRAINT "PnlHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metadata" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioItem_ticker_idx" ON "PortfolioItem"("ticker");

-- CreateIndex
CREATE INDEX "PortfolioItem_enabled_idx" ON "PortfolioItem"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RarityConfig_name_key" ON "RarityConfig"("name");

-- CreateIndex
CREATE INDEX "Card_rarityName_idx" ON "Card"("rarityName");

-- CreateIndex
CREATE UNIQUE INDEX "PnlHistory_date_key" ON "PnlHistory"("date");

-- CreateIndex
CREATE INDEX "PnlHistory_date_idx" ON "PnlHistory"("date");

-- CreateIndex
CREATE INDEX "PnlHistory_recordedAt_idx" ON "PnlHistory"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_key_key" ON "Metadata"("key");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_rarityName_fkey" FOREIGN KEY ("rarityName") REFERENCES "RarityConfig"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

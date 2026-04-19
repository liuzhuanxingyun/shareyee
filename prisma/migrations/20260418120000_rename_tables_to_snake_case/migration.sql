-- Rename tables
ALTER TABLE "CapitalFlow" RENAME TO "money_flow";
ALTER TABLE "PortfolioItem" RENAME TO "crypto_item";
ALTER TABLE "RarityConfig" RENAME TO "card_rarity_config";
ALTER TABLE "Card" RENAME TO "card_item";
ALTER TABLE "PnlHistory" RENAME TO "pnl_history";
ALTER TABLE "TransactionLog" RENAME TO "transaction_log";

-- Rename columns
ALTER TABLE "transaction_log" RENAME COLUMN "portfolioItemId" TO "cryptoItemId";

-- Rename indexes on money_flow
ALTER INDEX "CapitalFlow_status_idx" RENAME TO "money_flow_status_idx";
ALTER INDEX "CapitalFlow_pkey" RENAME TO "money_flow_pkey";
ALTER INDEX "CapitalFlow_orderId_key" RENAME TO "money_flow_orderId_key";
ALTER INDEX "CapitalFlow_occurredAt_idx" RENAME TO "money_flow_occurredAt_idx";

-- Rename indexes on crypto_item
ALTER INDEX "PortfolioItem_ticker_idx" RENAME TO "crypto_item_ticker_idx";
ALTER INDEX "PortfolioItem_enabled_idx" RENAME TO "crypto_item_enabled_idx";
ALTER INDEX "PortfolioItem_pkey" RENAME TO "crypto_item_pkey";

-- Rename indexes on card_rarity_config
ALTER INDEX "RarityConfig_pkey" RENAME TO "card_rarity_config_pkey";
ALTER INDEX "RarityConfig_name_key" RENAME TO "card_rarity_config_name_key";

-- Rename indexes on card_item
ALTER INDEX "Card_rarityName_idx" RENAME TO "card_item_rarityName_idx";
ALTER INDEX "Card_pkey" RENAME TO "card_item_pkey";

-- Rename indexes on pnl_history
ALTER INDEX "PnlHistory_date_key" RENAME TO "pnl_history_date_key";
ALTER INDEX "PnlHistory_pkey" RENAME TO "pnl_history_pkey";
ALTER INDEX "PnlHistory_date_idx" RENAME TO "pnl_history_date_idx";
ALTER INDEX "PnlHistory_recordedAt_idx" RENAME TO "pnl_history_recordedAt_idx";

-- Rename indexes on transaction_log
ALTER INDEX "TransactionLog_occurredAt_idx" RENAME TO "transaction_log_occurredAt_idx";
ALTER INDEX "TransactionLog_pkey" RENAME TO "transaction_log_pkey";
ALTER INDEX "TransactionLog_portfolioItemId_idx" RENAME TO "transaction_log_cryptoItemId_idx";

-- Rename constraints on crypto_item
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_pkey" TO "crypto_item_pkey";

-- Rename constraints on card_rarity_config
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_pkey" TO "card_rarity_config_pkey";

-- Rename constraints on card_item
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_pkey" TO "card_item_pkey";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_rarityName_fkey" TO "card_item_rarityName_fkey";

-- Rename constraints on pnl_history
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_pkey" TO "pnl_history_pkey";

-- Rename constraints on transaction_log
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_pkey" TO "transaction_log_pkey";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_portfolioItemId_fkey" TO "transaction_log_cryptoItemId_fkey";

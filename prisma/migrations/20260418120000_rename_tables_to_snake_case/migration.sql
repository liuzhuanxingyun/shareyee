-- Rename tables
ALTER TABLE "CapitalFlow" RENAME TO "money_flow";
ALTER TABLE "PortfolioItem" RENAME TO "crypto_item";
ALTER TABLE "RarityConfig" RENAME TO "card_rarity_config";
ALTER TABLE "Card" RENAME TO "card_item";
ALTER TABLE "PnlHistory" RENAME TO "pnl_history";
ALTER TABLE "TransactionLog" RENAME TO "transaction_log";

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

-- Rename constraints on money_flow
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_id_not_null" TO "money_flow_id_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_orderId_not_null" TO "money_flow_orderId_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_orderType_not_null" TO "money_flow_orderType_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_asset_not_null" TO "money_flow_asset_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_fiatCurrency_not_null" TO "money_flow_fiatCurrency_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_fiatAmount_not_null" TO "money_flow_fiatAmount_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_unitPrice_not_null" TO "money_flow_unitPrice_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_assetAmount_not_null" TO "money_flow_assetAmount_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_status_not_null" TO "money_flow_status_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_occurredAt_not_null" TO "money_flow_occurredAt_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_createdAt_not_null" TO "money_flow_createdAt_not_null";
ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_updatedAt_not_null" TO "money_flow_updatedAt_not_null";

-- Rename constraints on crypto_item
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_ticker_not_null" TO "crypto_item_ticker_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_cost_not_null" TO "crypto_item_cost_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_enabled_not_null" TO "crypto_item_enabled_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_sortOrder_not_null" TO "crypto_item_sortOrder_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_createdAt_not_null" TO "crypto_item_createdAt_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_updatedAt_not_null" TO "crypto_item_updatedAt_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_pkey" TO "crypto_item_pkey";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_id_not_null" TO "crypto_item_id_not_null";
ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_label_not_null" TO "crypto_item_label_not_null";

-- Rename constraints on card_rarity_config
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_id_not_null" TO "card_rarity_config_id_not_null";
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_name_not_null" TO "card_rarity_config_name_not_null";
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_color_not_null" TO "card_rarity_config_color_not_null";
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_probability_not_null" TO "card_rarity_config_probability_not_null";
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_createdAt_not_null" TO "card_rarity_config_createdAt_not_null";
ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_pkey" TO "card_rarity_config_pkey";

-- Rename constraints on card_item
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_id_not_null" TO "card_item_id_not_null";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_pkey" TO "card_item_pkey";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_rarityName_fkey" TO "card_item_rarityName_fkey";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_title_not_null" TO "card_item_title_not_null";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_text_not_null" TO "card_item_text_not_null";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_image_not_null" TO "card_item_image_not_null";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_rarityName_not_null" TO "card_item_rarityName_not_null";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_createdAt_not_null" TO "card_item_createdAt_not_null";
ALTER TABLE "card_item" RENAME CONSTRAINT "Card_updatedAt_not_null" TO "card_item_updatedAt_not_null";

-- Rename constraints on pnl_history
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_pkey" TO "pnl_history_pkey";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_id_not_null" TO "pnl_history_id_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_date_not_null" TO "pnl_history_date_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_recordedAt_not_null" TO "pnl_history_recordedAt_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_timezone_not_null" TO "pnl_history_timezone_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_trigger_not_null" TO "pnl_history_trigger_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_win_not_null" TO "pnl_history_win_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_createdAt_not_null" TO "pnl_history_createdAt_not_null";
ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_updatedAt_not_null" TO "pnl_history_updatedAt_not_null";

-- Rename constraints on transaction_log
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_id_not_null" TO "transaction_log_id_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_portfolioItemId_not_null" TO "transaction_log_cryptoItemId_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_type_not_null" TO "transaction_log_type_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_cost_not_null" TO "transaction_log_cost_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_occurredAt_not_null" TO "transaction_log_occurredAt_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_createdAt_not_null" TO "transaction_log_createdAt_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_updatedAt_not_null" TO "transaction_log_updatedAt_not_null";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_pkey" TO "transaction_log_pkey";
ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_portfolioItemId_fkey" TO "transaction_log_cryptoItemId_fkey";

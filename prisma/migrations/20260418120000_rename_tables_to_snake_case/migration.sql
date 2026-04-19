-- Rename tables (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CapitalFlow') THEN
        ALTER TABLE "CapitalFlow" RENAME TO "money_flow";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PortfolioItem') THEN
        ALTER TABLE "PortfolioItem" RENAME TO "crypto_item";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RarityConfig') THEN
        ALTER TABLE "RarityConfig" RENAME TO "card_rarity_config";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Card') THEN
        ALTER TABLE "Card" RENAME TO "card_item";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PnlHistory') THEN
        ALTER TABLE "PnlHistory" RENAME TO "pnl_history";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TransactionLog') THEN
        ALTER TABLE "TransactionLog" RENAME TO "transaction_log";
    END IF;
END $$;

-- Rename columns (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_log' AND column_name = 'portfolioItemId') THEN
        ALTER TABLE "transaction_log" RENAME COLUMN "portfolioItemId" TO "cryptoItemId";
    END IF;
END $$;

-- Rename indexes on money_flow (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CapitalFlow_status_idx' AND tablename = 'money_flow') THEN
        ALTER INDEX "CapitalFlow_status_idx" RENAME TO "money_flow_status_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CapitalFlow_pkey' AND tablename = 'money_flow') THEN
        ALTER INDEX "CapitalFlow_pkey" RENAME TO "money_flow_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CapitalFlow_orderId_key' AND tablename = 'money_flow') THEN
        ALTER INDEX "CapitalFlow_orderId_key" RENAME TO "money_flow_orderId_key";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CapitalFlow_occurredAt_idx' AND tablename = 'money_flow') THEN
        ALTER INDEX "CapitalFlow_occurredAt_idx" RENAME TO "money_flow_occurredAt_idx";
    END IF;
END $$;

-- Rename indexes on crypto_item (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PortfolioItem_ticker_idx' AND tablename = 'crypto_item') THEN
        ALTER INDEX "PortfolioItem_ticker_idx" RENAME TO "crypto_item_ticker_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PortfolioItem_enabled_idx' AND tablename = 'crypto_item') THEN
        ALTER INDEX "PortfolioItem_enabled_idx" RENAME TO "crypto_item_enabled_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PortfolioItem_pkey' AND tablename = 'crypto_item') THEN
        ALTER INDEX "PortfolioItem_pkey" RENAME TO "crypto_item_pkey";
    END IF;
END $$;

-- Rename indexes on card_rarity_config (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'RarityConfig_pkey' AND tablename = 'card_rarity_config') THEN
        ALTER INDEX "RarityConfig_pkey" RENAME TO "card_rarity_config_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'RarityConfig_name_key' AND tablename = 'card_rarity_config') THEN
        ALTER INDEX "RarityConfig_name_key" RENAME TO "card_rarity_config_name_key";
    END IF;
END $$;

-- Rename indexes on card_item (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Card_rarityName_idx' AND tablename = 'card_item') THEN
        ALTER INDEX "Card_rarityName_idx" RENAME TO "card_item_rarityName_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Card_pkey' AND tablename = 'card_item') THEN
        ALTER INDEX "Card_pkey" RENAME TO "card_item_pkey";
    END IF;
END $$;

-- Rename indexes on pnl_history (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PnlHistory_date_key' AND tablename = 'pnl_history') THEN
        ALTER INDEX "PnlHistory_date_key" RENAME TO "pnl_history_date_key";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PnlHistory_pkey' AND tablename = 'pnl_history') THEN
        ALTER INDEX "PnlHistory_pkey" RENAME TO "pnl_history_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PnlHistory_date_idx' AND tablename = 'pnl_history') THEN
        ALTER INDEX "PnlHistory_date_idx" RENAME TO "pnl_history_date_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PnlHistory_recordedAt_idx' AND tablename = 'pnl_history') THEN
        ALTER INDEX "PnlHistory_recordedAt_idx" RENAME TO "pnl_history_recordedAt_idx";
    END IF;
END $$;

-- Rename indexes on transaction_log (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'TransactionLog_occurredAt_idx' AND tablename = 'transaction_log') THEN
        ALTER INDEX "TransactionLog_occurredAt_idx" RENAME TO "transaction_log_occurredAt_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'TransactionLog_pkey' AND tablename = 'transaction_log') THEN
        ALTER INDEX "TransactionLog_pkey" RENAME TO "transaction_log_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'TransactionLog_portfolioItemId_idx' AND tablename = 'transaction_log') THEN
        ALTER INDEX "TransactionLog_portfolioItemId_idx" RENAME TO "transaction_log_cryptoItemId_idx";
    END IF;
END $$;

-- Rename constraints on money_flow (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'CapitalFlow_pkey' AND t.relname = 'money_flow') THEN
        ALTER TABLE "money_flow" RENAME CONSTRAINT "CapitalFlow_pkey" TO "money_flow_pkey";
    END IF;
END $$;

-- Rename constraints on crypto_item (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'PortfolioItem_pkey' AND t.relname = 'crypto_item') THEN
        ALTER TABLE "crypto_item" RENAME CONSTRAINT "PortfolioItem_pkey" TO "crypto_item_pkey";
    END IF;
END $$;

-- Rename constraints on card_rarity_config (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'RarityConfig_pkey' AND t.relname = 'card_rarity_config') THEN
        ALTER TABLE "card_rarity_config" RENAME CONSTRAINT "RarityConfig_pkey" TO "card_rarity_config_pkey";
    END IF;
END $$;

-- Rename constraints on card_item (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'Card_pkey' AND t.relname = 'card_item') THEN
        ALTER TABLE "card_item" RENAME CONSTRAINT "Card_pkey" TO "card_item_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'Card_rarityName_fkey' AND t.relname = 'card_item') THEN
        ALTER TABLE "card_item" RENAME CONSTRAINT "Card_rarityName_fkey" TO "card_item_rarityName_fkey";
    END IF;
END $$;

-- Rename constraints on pnl_history (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'PnlHistory_pkey' AND t.relname = 'pnl_history') THEN
        ALTER TABLE "pnl_history" RENAME CONSTRAINT "PnlHistory_pkey" TO "pnl_history_pkey";
    END IF;
END $$;

-- Rename constraints on transaction_log (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'TransactionLog_pkey' AND t.relname = 'transaction_log') THEN
        ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_pkey" TO "transaction_log_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid WHERE c.conname = 'TransactionLog_portfolioItemId_fkey' AND t.relname = 'transaction_log') THEN
        ALTER TABLE "transaction_log" RENAME CONSTRAINT "TransactionLog_portfolioItemId_fkey" TO "transaction_log_cryptoItemId_fkey";
    END IF;
END $$;

// 投资组合服务

import { prisma } from '../lib/prisma.js';
import { toNumberOrNull, formatQuantity } from '../utils/format.js';
import { normalizeAddress, normalizeLookupKey } from '../utils/text.js';
import { getForexRate } from '../utils/fetch.js';
import {
  WEB3_CHAIN,
  WEB3_WALLET_ADDRESS,
  loadPortfolio,
  loadWalletTokens,
  buildTokenIndex,
  resolveWalletToken,
  isUsdtLikeAsset,
  stooqPrice,
} from './wallet.js';
import { tokenLogoRegistry, chainLabelFromValue } from './token-logo.js';

const EMAIL_TIMEZONE = 'Asia/Shanghai';

export async function buildPortfolioReport() {
  const portfolioDefinition = await loadPortfolio();
  const portfolio = portfolioDefinition.items;
  let walletTokens = [];
  let walletSyncStatus = 'empty';
  let walletSyncError = null;

  try {
    walletTokens = await loadWalletTokens();
    walletSyncStatus = walletTokens.length ? 'ok' : 'empty';
  } catch (err) {
    walletSyncStatus = 'error';
    walletSyncError = err.message;
    console.error('[wallet]', err.message);
  }

  const forexRate = await getForexRate().catch(err => {
    console.error('[forex]', err.message);
    return null;
  });

  const tokenIndex = buildTokenIndex(walletTokens);

  const rows = await Promise.all(portfolio.map(async (item, index) => {
    const walletToken = resolveWalletToken(item, tokenIndex);
    const walletBalance = walletToken
      ? toNumberOrNull(walletToken.balance_formatted ?? walletToken.balance)
      : null;
    const legacyBalance = Number.isFinite(Number(item.shares)) ? Number(item.shares) : null;
    const balance = walletBalance ?? legacyBalance ?? null;
    const tokenAddress = normalizeAddress(walletToken?.token_address || walletToken?.address || item.contractAddress || item.tokenAddress || item.address);
    const logoKey = tokenAddress || normalizeLookupKey(walletToken?.symbol || item.ticker || item.label || `item-${index}`);

    tokenLogoRegistry.set(logoKey, {
      tokenAddress,
      symbol: walletToken?.symbol || item.ticker || item.label || null,
      name: walletToken?.name || item.label || item.ticker || null,
      label: item.label,
      moralisLogo: walletToken?.logo || null,
      thumbnail: walletToken?.thumbnail || null,
      chain: WEB3_CHAIN,
    });

    const isCash = isUsdtLikeAsset(item, walletToken);
    const price = isCash
      ? 1
      : await stooqPrice(item.ticker).catch(() => null);
    const marketValue = balance !== null && price !== null
      ? price * balance
      : null;
    const avg = !isCash && balance !== null && balance > 0 ? item.cost / balance : null;
    const pnl = !isCash && marketValue !== null ? marketValue - item.cost : null;
    const pnlPct = pnl !== null && item.cost > 0 ? (pnl / item.cost) * 100 : null;

    return {
      ...item,
      isCash,
      balance,
      avg,
      price,
      marketValue,
      pnl,
      pnlPct,
      tokenName: walletToken?.name || null,
      tokenSymbol: walletToken?.symbol || item.ticker,
      tokenAddress,
      logoKey,
      logo: `/api/token-logo/${encodeURIComponent(logoKey)}`,
      usdValue24hPercentChange: toNumberOrNull(walletToken?.usd_price_24hr_percent_change),
      portfolioPercentage: toNumberOrNull(walletToken?.portfolio_percentage),
      balanceSource: walletToken ? 'wallet' : legacyBalance !== null ? 'legacy' : 'unknown',
      priceSource: isCash
        ? 'par'
        : (price !== null ? 'stooq' : 'unknown'),
      balanceDisplay: formatQuantity(balance),
    };
  }));

  const hasResolvedBalances = rows.some(row => row.balance !== null);
  const valuePoolUsd = walletSyncStatus === 'error' && !hasResolvedBalances
    ? null
    : rows.reduce((sum, row) => sum + (row.marketValue || 0), 0);
  const valuePoolRmb = valuePoolUsd !== null && forexRate ? valuePoolUsd * forexRate : null;
  const costBasisUsd = rows.reduce((sum, row) => sum + (row.isCash ? 0 : (Number.isFinite(row.cost) ? row.cost : 0)), 0);
  const inputPoolUsd = Number.isFinite(portfolioDefinition.capitalUsd)
    ? portfolioDefinition.capitalUsd
    : (forexRate && Number.isFinite(portfolioDefinition.capitalRmb) ? portfolioDefinition.capitalRmb / forexRate : null);
  const inputPoolRmb = Number.isFinite(portfolioDefinition.capitalRmb)
    ? portfolioDefinition.capitalRmb
    : (forexRate && Number.isFinite(portfolioDefinition.capitalUsd) ? portfolioDefinition.capitalUsd * forexRate : null);
  const pnlUsd = valuePoolUsd !== null && inputPoolUsd !== null
    ? valuePoolUsd - inputPoolUsd
    : null;
  const pnlRmb = pnlUsd !== null && forexRate ? pnlUsd * forexRate : null;
  const pnlPct = pnlUsd !== null && inputPoolUsd > 0 ? (pnlUsd / inputPoolUsd) * 100 : null;

  return {
    rows,
    wallet: {
      address: WEB3_WALLET_ADDRESS,
      chain: WEB3_CHAIN,
      chainLabel: chainLabelFromValue(WEB3_CHAIN),
      provider: 'Moralis',
      tokenCount: walletTokens.length,
      matchedCount: rows.filter(row => row.balanceSource === 'wallet').length,
      syncStatus: walletSyncStatus,
      syncError: walletSyncError,
    },
    forexRate,
    capitalRmb: inputPoolRmb,
    capitalUsd: inputPoolUsd,
    inputPoolRmb,
    inputPoolUsd,
    valuePoolUsd,
    valuePoolRmb,
    totalCost: inputPoolUsd,
    totalCostRmb: inputPoolRmb,
    totalCostUsd: inputPoolUsd,
    totalMarketValue: valuePoolUsd,
    totalMarketValueRmb: valuePoolRmb,
    totalMarketValueUsd: valuePoolUsd,
    totalPnl: pnlUsd,
    totalPnlUsd: pnlUsd,
    totalPnlRmb: pnlRmb,
    totalPnlPct: pnlPct,
    totalPnlCny: pnlRmb,
    generatedAt: new Date().toISOString(),
  };
}

export async function loadWinOrNotHistory() {
  const records = await prisma.pnlHistory.findMany({
    orderBy: { recordedAt: 'asc' }
  });

  return records.map(r => ({
    date: r.date,
    recordedAt: r.recordedAt.toISOString(),
    timezone: r.timezone,
    trigger: r.trigger,
    totalCost: r.totalCost,
    totalMarketValue: r.totalMarketValue,
    totalPnl: r.totalPnl,
    totalPnlPct: r.totalPnlPct,
    totalPnlCny: r.totalPnlCny,
    forexRate: r.forexRate,
    win: r.win,
  }));
}

export async function appendWinOrNotRecord(reason = 'cron') {
  const report = await buildPortfolioReport();
  const date = new Date(report.generatedAt).toISOString().slice(0, 10);
  const inputPoolUsd = Number.isFinite(report.inputPoolUsd) ? Number(report.inputPoolUsd.toFixed(2)) : null;
  const valuePoolUsd = Number.isFinite(report.valuePoolUsd) ? Number(report.valuePoolUsd.toFixed(2)) : null;
  const totalPnlUsd = Number.isFinite(report.totalPnl) ? Number(report.totalPnl.toFixed(2)) : null;
  const totalPnlRmb = Number.isFinite(report.totalPnlRmb) ? Number(report.totalPnlRmb.toFixed(2)) : null;
  const totalPnlPct = Number.isFinite(report.totalPnlPct) ? Number(report.totalPnlPct.toFixed(4)) : null;

  await prisma.pnlHistory.upsert({
    where: { date },
    create: {
      date,
      recordedAt: new Date(report.generatedAt),
      timezone: EMAIL_TIMEZONE,
      trigger: reason,
      totalCost: inputPoolUsd,
      totalMarketValue: valuePoolUsd,
      totalPnl: totalPnlUsd,
      totalPnlPct,
      totalPnlCny: totalPnlRmb,
      forexRate: report.forexRate !== null ? Number(report.forexRate.toFixed(6)) : null,
      win: Number.isFinite(report.totalPnl) ? report.totalPnl >= 0 : false,
    },
    update: {
      recordedAt: new Date(report.generatedAt),
      timezone: EMAIL_TIMEZONE,
      trigger: reason,
      totalCost: inputPoolUsd,
      totalMarketValue: valuePoolUsd,
      totalPnl: totalPnlUsd,
      totalPnlPct,
      totalPnlCny: totalPnlRmb,
      forexRate: report.forexRate !== null ? Number(report.forexRate.toFixed(6)) : null,
      win: Number.isFinite(report.totalPnl) ? report.totalPnl >= 0 : false,
    }
  });

  const count = await prisma.pnlHistory.count();

  return {
    recordedAt: report.generatedAt,
    totalPnlPct: report.totalPnlPct,
    win: report.totalPnl >= 0,
    count,
  };
}

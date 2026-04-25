// 钱包服务

import { prisma } from '../lib/prisma.js';
import { fetchJsonWithUA } from '../utils/fetch.js';
import { normalizeAddress, normalizeLookupKey } from '../utils/text.js';
import { toNumberOrNull } from '../utils/format.js';
import { tokenLogoRegistry } from './token-logo.js';

export const WEB3_WALLET_ADDRESS = process.env.WEB3_WALLET_ADDRESS || process.env.WALLET_ADDRESS || '0x5920efce45f6221f33c6923aa4e25951357389ca';
export const WEB3_CHAIN = process.env.WEB3_CHAIN || 'bsc';
export const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
export const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
export const WEB3_CACHE_TTL_MS = Number(process.env.WEB3_CACHE_TTL_MS || 60_000);

let walletTokenCache = { at: 0, tokens: [] };
let walletTokenPromise = null;

// Stooq 股价查询
const STOOQ_MAP = { UBER: 'uber.us', TQQQ: 'tqqq.us', COIN: 'coin.us', BABA: 'baba.us' };

export async function stooqPrice(ticker) {
  const sym = STOOQ_MAP[ticker] ?? ticker.toLowerCase() + '.us';
  const url = `https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlc&h&e=csv`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Stooq HTTP ${r.status} for ${ticker}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const cols = lines[1].split(',');
  const close = parseFloat(cols[6]);
  return isNaN(close) ? null : close;
}

export function portfolioAliases(raw) {
  const aliases = new Set();
  const ticker = normalizeLookupKey(raw.ticker);
  const label = normalizeLookupKey(raw.label);

  if (ticker) {
    aliases.add(ticker);
    aliases.add(ticker.replace(/ON$/, ''));
    aliases.add(`${ticker}ON`);
  }

  if (label) {
    aliases.add(label);
    aliases.add(label.replace(/ON$/, ''));
  }

  const tokenAddress = normalizeAddress(raw.contractAddress || raw.tokenAddress || raw.address);
  if (tokenAddress) aliases.add(tokenAddress);

  return [...aliases].filter(Boolean);
}

export function tokenAliases(token) {
  const aliases = new Set();
  const symbol = normalizeLookupKey(token.symbol);
  const name = normalizeLookupKey(token.name);

  if (symbol) {
    aliases.add(symbol);
    aliases.add(symbol.replace(/ON$/, ''));
    aliases.add(`${symbol}ON`);
  }

  if (name) {
    aliases.add(name);
    aliases.add(name.replace(/ON$/, ''));
  }

  const tokenAddress = normalizeAddress(token.token_address || token.address);
  if (tokenAddress) aliases.add(tokenAddress);

  return [...aliases].filter(Boolean);
}

export function selectBestToken(tokens) {
  if (!Array.isArray(tokens) || !tokens.length) return null;

  return [...tokens].sort((left, right) => {
    const leftValue = Number(left.usd_value ?? left.balance ?? 0);
    const rightValue = Number(right.usd_value ?? right.balance ?? 0);
    if (rightValue !== leftValue) return rightValue - leftValue;

    const leftBalance = Number(left.balance_formatted ?? left.balance ?? 0);
    const rightBalance = Number(right.balance_formatted ?? right.balance ?? 0);
    if (rightBalance !== leftBalance) return rightBalance - leftBalance;

    return String(left.symbol ?? '').localeCompare(String(right.symbol ?? ''));
  })[0];
}

export function buildTokenIndex(tokens) {
  const byAddress = new Map();
  const byAlias = new Map();

  for (const token of tokens) {
    const address = normalizeAddress(token.token_address || token.address);
    if (address) byAddress.set(address, token);

    for (const alias of tokenAliases(token)) {
      if (!byAlias.has(alias)) byAlias.set(alias, []);
      byAlias.get(alias).push(token);
    }
  }

  return { byAddress, byAlias };
}

export function resolveWalletToken(item, tokenIndex) {
  const directAddress = normalizeAddress(item.contractAddress || item.tokenAddress || item.address);
  if (directAddress && tokenIndex.byAddress.has(directAddress)) {
    return tokenIndex.byAddress.get(directAddress);
  }

  const matches = [];
  for (const alias of portfolioAliases(item)) {
    const bucket = tokenIndex.byAlias.get(alias);
    if (bucket?.length) matches.push(...bucket);
  }

  return selectBestToken(matches);
}

export async function loadWalletTokens() {
  if (!MORALIS_API_KEY || !WEB3_WALLET_ADDRESS) return [];

  const now = Date.now();
  if (walletTokenCache.tokens.length && now - walletTokenCache.at < WEB3_CACHE_TTL_MS) {
    return walletTokenCache.tokens;
  }

  if (walletTokenPromise) return walletTokenPromise;

  walletTokenPromise = (async () => {
    const tokens = [];
    let cursor = '';

    for (let page = 0; page < 10; page += 1) {
      const url = new URL(`${MORALIS_BASE_URL}/wallets/${WEB3_WALLET_ADDRESS}/tokens`);
      url.searchParams.set('chain', WEB3_CHAIN);
      url.searchParams.set('exclude_spam', 'true');
      url.searchParams.set('exclude_native', 'true');
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Moralis HTTP ${res.status}`);
      }

      const body = await res.json();
      const pageTokens = Array.isArray(body.result) ? body.result : [];
      tokens.push(...pageTokens);

      if (!body.cursor || pageTokens.length < 100) break;
      cursor = body.cursor;
    }

    walletTokenCache = { at: Date.now(), tokens };
    return tokens;
  })();

  try {
    return await walletTokenPromise;
  } finally {
    walletTokenPromise = null;
  }
}

export function isUsdtLikeAsset(item, walletToken) {
  const candidates = [item?.label, item?.ticker, walletToken?.symbol, walletToken?.name];
  return candidates.some(value => {
    const key = normalizeLookupKey(value);
    return key.includes('USDT') || key.includes('TETHERUSD');
  });
}

export async function loadPortfolio() {
  const items = await prisma.cryptoItem.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' }
  });

  const [aggregate] = await prisma.$queryRaw`
    SELECT COALESCE(SUM("fiatAmount"), 0) as "fiatAmount", COALESCE(SUM("assetAmount"), 0) as "assetAmount"
    FROM "money_flow"
    WHERE status = 'Completed'
  `;
  const capitalRmb = Number(aggregate?.fiatAmount) || null;
  const capitalUsd = Number(aggregate?.assetAmount) || null;

  return {
    capitalRmb,
    capitalUsd,
    items: items.map(item => ({
      label: item.label,
      ticker: item.ticker,
      cost: item.cost,
      enabled: item.enabled,
      shares: item.shares,
      contractAddress: item.contractAddress,
    })),
  };
}

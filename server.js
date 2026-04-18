import 'dotenv/config';
import express            from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import cron              from 'node-cron';
import nodemailer        from 'nodemailer';
import { prisma }        from './lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NEWS_TIMEOUT_MS = 6000;
const EMAIL_TIMEZONE = 'Asia/Shanghai';
const MAP_FETCH_TIMEOUT_MS = 8000;
const WEB3_WALLET_ADDRESS = process.env.WEB3_WALLET_ADDRESS || process.env.WALLET_ADDRESS || '0x5920efce45f6221f33c6923aa4e25951357389ca';
const WEB3_CHAIN = process.env.WEB3_CHAIN || 'bsc';
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
const WEB3_CACHE_TTL_MS = Number(process.env.WEB3_CACHE_TTL_MS || 60_000);
const TOKEN_LOGO_TIMEOUT_MS = 3000;
const TOKEN_LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const tokenLogoRegistry = new Map();
const tokenLogoCache = new Map();

const WEB3_CHAIN_LABELS = {
  eth: 'Ethereum',
  '0x1': 'Ethereum',
  1: 'Ethereum',
  bsc: 'BNB Chain',
  '0x38': 'BNB Chain',
  56: 'BNB Chain',
  polygon: 'Polygon',
  '0x89': 'Polygon',
  137: 'Polygon',
  arbitrum: 'Arbitrum',
  '0xa4b1': 'Arbitrum',
  42161: 'Arbitrum',
};

let walletTokenCache = { at: 0, tokens: [] };
let walletTokenPromise = null;

const MAIL_CONFIG = {
  enabled: process.env.MAIL_ENABLED === '1',
  host: process.env.MAIL_HOST || 'smtp.qq.com',
  port: Number(process.env.MAIL_PORT || 465),
  secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE === 'true' : true,
  user: process.env.MAIL_USER || '2243709509@qq.com',
  pass: process.env.MAIL_PASS || '',
  from: process.env.MAIL_FROM || '2243709509@qq.com',
  to: process.env.MAIL_TO || '2160255989@qq.com',
  testToken: process.env.MAIL_TEST_TOKEN || '',
};

const mailTransporter = nodemailer.createTransport({
  host: MAIL_CONFIG.host,
  port: MAIL_CONFIG.port,
  secure: MAIL_CONFIG.secure,
  auth: {
    user: MAIL_CONFIG.user,
    pass: MAIL_CONFIG.pass,
  },
});

// ─── Stooq price fetch (free, no API key) ─────────────────────────────────
const STOOQ_MAP = { UBER: 'uber.us', TQQQ: 'tqqq.us', COIN: 'coin.us', BABA: 'baba.us' };

async function stooqPrice(ticker) {
  const sym = STOOQ_MAP[ticker] ?? ticker.toLowerCase() + '.us';
  const url = `https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlc&h&e=csv`;
  const r   = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Stooq HTTP ${r.status} for ${ticker}`);
  const text  = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const cols  = lines[1].split(',');
  const close = parseFloat(cols[6]); // Symbol,Date,Time,Open,High,Low,Close
  return isNaN(close) ? null : close;
}

function f2(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '--';
}

function signedMoney(value, unit = '$') {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'N/A';
  const sign = number >= 0 ? '+' : '-';
  return `${sign}${unit}${Math.abs(number).toFixed(2)}`;
}

async function getForexRate() {
  const r = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const body = await r.json();
  return body.rates.CNY;
}

async function fetchJsonWithUA(url, timeoutMs = MAP_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Shareyee map proxy)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTextWithUA(url, timeoutMs = MAP_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Shareyee news proxy)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanText(value) {
  return decodeHtmlEntities(String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function stripHtml(html) {
  return cleanText(String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' '));
}

function chinaYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EMAIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}${map.month}`;
}

function previousChinaYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EMAIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  let year = Number(map.year);
  let month = Number(map.month) - 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `${year}${String(month).padStart(2, '0')}`;
}

function extractMetaContent(html, names) {
  for (const name of names) {
    const escaped = escapeRegExp(name);
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = String(html ?? '').match(pattern);
      if (match?.[1]) return cleanText(match[1]);
    }
  }

  return null;
}

function toIsoTimestamp(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    const ms = number > 1e12 ? number : number * 1000;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeWscnSummary(item, title = '') {
  const raw = item?.content_text || item?.content || item?.reference || '';
  const text = cleanText(raw).replace(/\s+/g, ' ').trim();
  if (!text) return title;
  return text.slice(0, 180);
}

function normalizeWscnLink(item) {
  if (isHttpUrl(item?.uri)) return String(item.uri).trim();
  if (item?.id) return `https://wallstreetcn.com/livenews/${item.id}`;
  return 'https://wallstreetcn.com/livenews';
}

async function fetchWscnNews(limit = 3) {
  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 10);
  const requestLimit = Math.min(Math.max(safeLimit * 5, safeLimit), 50);
  const endpoint = new URL('https://api-one-wscn.awtmt.com/apiv1/content/lives');
  endpoint.searchParams.set('channel', 'global-channel');
  endpoint.searchParams.set('page', '1');
  endpoint.searchParams.set('limit', String(requestLimit));

  try {
    const payload = await fetchJsonWithUA(endpoint.toString(), NEWS_TIMEOUT_MS);
    const rawItems = Array.isArray(payload?.data?.items) ? payload.data.items : [];
    const seenLinks = new Set();
    const items = [];

    for (const item of rawItems) {
      const title = cleanText(item?.title || item?.highlight_title || '');
      if (!title) continue;

      const link = normalizeWscnLink(item);
      if (seenLinks.has(link)) continue;
      seenLinks.add(link);

      items.push({
        title,
        summary: normalizeWscnSummary(item, title),
        link,
        pubDate: toIsoTimestamp(item?.display_time || item?.published_at || item?.created_at),
        source: '华尔街见闻',
        feedSource: '华尔街见闻快讯 API',
      });

      if (items.length >= safeLimit) break;
    }

    return items;
  } catch (err) {
    console.error('[news] WSCN lives:', err.message);
    return [];
  }
}

function normalizeLookupKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^A-Z0-9.]/g, '');
}

function normalizeAddress(value) {
  const address = String(value ?? '').trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(address) ? address : '';
}

function chainLabelFromValue(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return WEB3_CHAIN_LABELS[key] || WEB3_CHAIN_LABELS[key.replace(/^0x/, '')] || String(value ?? '').toUpperCase();
}

function toNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isUsdtLikeAsset(item, walletToken) {
  const candidates = [item?.label, item?.ticker, walletToken?.symbol, walletToken?.name];
  return candidates.some(value => {
    const key = normalizeLookupKey(value);
    return key.includes('USDT') || key.includes('TETHERUSD');
  });
}

function formatQuantity(value) {
  if (!Number.isFinite(value)) return '--';
  if (value === 0) return '0.00000';
  return value.toFixed(5);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value ?? '').trim());
}

function hashString(value) {
  let hash = 0;
  for (const char of String(value ?? '')) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildFallbackLogoResponse(meta = {}) {
  const rawLabel = normalizeLookupKey(meta.symbol || meta.name || meta.label || meta.key);
  const displayText = rawLabel.replace(/[^A-Z0-9]/g, '').slice(0, 2) || '?';
  const baseKey = meta.tokenAddress || meta.symbol || meta.name || meta.label || meta.key || displayText;
  const hue = hashString(baseKey) % 360;
  const accentHue = (hue + 42) % 360;
  const fontSize = displayText.length > 1 ? 17 : 22;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(meta.name || meta.symbol || meta.label || 'token')}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 78% 56%)" />
      <stop offset="100%" stop-color="hsl(${accentHue} 78% 44%)" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#bg)" />
  <circle cx="47" cy="17" r="11" fill="#ffffff" fill-opacity="0.14" />
  <text x="32" y="39" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff" letter-spacing="0.6">${escapeXml(displayText)}</text>
</svg>`;

  return {
    body: Buffer.from(svg, 'utf8'),
    contentType: 'image/svg+xml; charset=utf-8',
    source: 'svg-fallback',
  };
}

async function fetchRemoteImage(url, timeoutMs = TOKEN_LOGO_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Shareyee token logo proxy)',
        Accept: 'image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected content-type ${contentType || 'unknown'}`);
    }

    return {
      body: Buffer.from(await res.arrayBuffer()),
      contentType: contentType || 'image/png',
      source: url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveTokenLogoResponse(meta = {}) {
  const candidates = [];
  const moralisLogo = isHttpUrl(meta.moralisLogo) ? String(meta.moralisLogo).trim() : '';
  const thumbnail = isHttpUrl(meta.thumbnail) ? String(meta.thumbnail).trim() : '';

  if (moralisLogo) {
    candidates.push({ kind: 'image', url: moralisLogo, source: 'moralis-logo' });
  }

  if (thumbnail && thumbnail !== moralisLogo) {
    candidates.push({ kind: 'image', url: thumbnail, source: 'moralis-thumbnail' });
  }

  const tokenAddress = normalizeAddress(meta.tokenAddress);
  if (tokenAddress) {
    candidates.push({
      kind: 'image',
      url: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${tokenAddress}/logo.png`,
      source: 'trustwallet',
    });

    candidates.push({
      kind: 'coingecko',
      url: `https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/${tokenAddress}`, 
      source: 'coingecko',
    });
  }

  for (const candidate of candidates) {
    try {
      if (candidate.kind === 'coingecko') {
        const json = await fetchJsonWithUA(candidate.url, TOKEN_LOGO_TIMEOUT_MS);
        const imageUrl = json?.image?.small || json?.image?.thumb || json?.image?.large;
        if (isHttpUrl(imageUrl)) {
          const proxied = await fetchRemoteImage(imageUrl, TOKEN_LOGO_TIMEOUT_MS);
          return {
            body: proxied.body,
            contentType: proxied.contentType,
            source: candidate.source,
          };
        }

        continue;
      }

      const proxied = await fetchRemoteImage(candidate.url, TOKEN_LOGO_TIMEOUT_MS);
      return {
        body: proxied.body,
        contentType: proxied.contentType,
        source: candidate.source,
      };
    } catch {
      continue;
    }
  }

  return buildFallbackLogoResponse(meta);
}

function portfolioAliases(raw) {
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

function tokenAliases(token) {
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

function selectBestToken(tokens) {
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

async function loadWalletTokens() {
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

function buildTokenIndex(tokens) {
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

function resolveWalletToken(item, tokenIndex) {
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

async function loadPortfolio() {
  // 从数据库加载持仓配置
  const items = await prisma.cryptoItem.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' }
  });

  // 从 MoneyFlow 汇总计算当前总投入（仅 Completed）
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

async function buildPortfolioReport() {
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

  const legacyInputPoolUsd = portfolio.reduce((sum, item) => sum + item.cost, 0);
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

function buildMailHtml(report) {
  const rowsHtml = report.rows.map(row => {
    const cost = row.cost !== null ? `$${f2(row.cost)}` : 'N/A';
    const price = row.price !== null ? `$${f2(row.price)}` : 'N/A';
    const balance = Number.isFinite(row.balance) ? row.balance.toFixed(5) : 'N/A';
    const pnl = row.pnl !== null ? signedMoney(row.pnl, '$') : 'N/A';
    const pnlPct = Number.isFinite(row.pnlPct) ? `${row.pnlPct >= 0 ? '+' : ''}${f2(row.pnlPct)}%` : 'N/A';
    return `<tr>
      <td>${row.label} (${row.ticker})</td>
      <td>${balance}</td>
      <td>${cost}</td>
      <td>${row.avg !== null ? `$${f2(row.avg)}` : 'N/A'}</td>
      <td>${price}</td>
      <td>${pnl}</td>
      <td>${pnlPct}</td>
    </tr>`;
  }).join('');

  return `
    <h2>Shareyee 持仓日报</h2>
    <p>只读钱包: ${WEB3_WALLET_ADDRESS} · ${chainLabelFromValue(WEB3_CHAIN)} · ${report.wallet.tokenCount} 个代币</p>
    <p>生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN', { timeZone: EMAIL_TIMEZONE })}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead>
        <tr>
          <th>资产</th><th>数量</th><th>投入成本</th><th>平均成本</th><th>当前价</th><th>盈亏(USD)</th><th>盈亏比例</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p>投入池: ¥${f2(report.inputPoolRmb)} / $${f2(report.inputPoolUsd)}</p>
    <p>价值池: ¥${f2(report.valuePoolRmb)} / $${f2(report.valuePoolUsd)}</p>
    <p>浮动盈亏(CNY): ${signedMoney(report.totalPnlRmb, 'CNY ')} (${Number.isFinite(report.totalPnlPct) ? `${report.totalPnlPct >= 0 ? '+' : ''}${f2(report.totalPnlPct)}%` : 'N/A'})</p>
    <p>浮动盈亏(USD): ${signedMoney(report.totalPnl, '$')}</p>
    <p>汇率: 1 USD = ${f2(report.forexRate)} CNY</p>
  `;
}

function chinaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: EMAIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

async function loadWinOrNotHistory() {
  // 从数据库加载盈亏历史
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

async function appendWinOrNotRecord(reason = 'cron') {
  const report = await buildPortfolioReport();
  const date = chinaDateString(new Date(report.generatedAt));
  const inputPoolRmb = Number.isFinite(report.inputPoolRmb) ? Number(report.inputPoolRmb.toFixed(2)) : null;
  const inputPoolUsd = Number.isFinite(report.inputPoolUsd) ? Number(report.inputPoolUsd.toFixed(2)) : null;
  const valuePoolUsd = Number.isFinite(report.valuePoolUsd) ? Number(report.valuePoolUsd.toFixed(2)) : null;
  const valuePoolRmb = Number.isFinite(report.valuePoolRmb) ? Number(report.valuePoolRmb.toFixed(2)) : null;
  const totalPnlUsd = Number.isFinite(report.totalPnl) ? Number(report.totalPnl.toFixed(2)) : null;
  const totalPnlRmb = Number.isFinite(report.totalPnlRmb) ? Number(report.totalPnlRmb.toFixed(2)) : null;
  const totalPnlPct = Number.isFinite(report.totalPnlPct) ? Number(report.totalPnlPct.toFixed(4)) : null;

  // 使用数据库 upsert 操作
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

async function sendPortfolioEmail(reason = 'scheduled') {
  if (!MAIL_CONFIG.enabled) {
    console.log('[mail] skipped: MAIL_ENABLED is not 1');
    return { sent: false, reason: 'disabled' };
  }
  if (!MAIL_CONFIG.pass) {
    throw new Error('MAIL_PASS is empty, please set QQ SMTP auth code');
  }

  const report = await buildPortfolioReport();
  const mailDate = new Intl.DateTimeFormat('zh-CN', {
    timeZone: EMAIL_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(report.generatedAt));
  await mailTransporter.sendMail({
    from: MAIL_CONFIG.from,
    to: MAIL_CONFIG.to,
    subject: `Shareyee 持仓盈亏日报 (${mailDate}) 总盈亏：${signedMoney(report.totalPnlRmb, 'CNY ')}`,
    html: buildMailHtml(report),
  });

  console.log(`[mail] sent (${reason}) to ${MAIL_CONFIG.to}`);
  return { sent: true, reason, generatedAt: report.generatedAt };
}

// ─── GET /api/token-logo/:key ─────────────────────────────────────────────
app.get('/api/token-logo/:key', async (req, res) => {
  const requestedKey = String(req.params.key ?? '').trim();
  const registryMeta = tokenLogoRegistry.get(requestedKey) || null;
  const tokenAddress = normalizeAddress(registryMeta?.tokenAddress || req.query.address || requestedKey);
  const symbol = String(registryMeta?.symbol || req.query.symbol || '').trim();
  const name = String(registryMeta?.name || req.query.name || '').trim();
  const label = String(registryMeta?.label || symbol || name || requestedKey).trim();
  const cacheKey = tokenAddress || normalizeLookupKey(symbol || name || requestedKey);

  const cached = tokenLogoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Token-Logo-Source', cached.source);
    res.send(cached.body);
    return;
  }

  try {
    const response = await resolveTokenLogoResponse({
      tokenAddress,
      symbol,
      name,
      label,
      key: requestedKey,
      moralisLogo: registryMeta?.moralisLogo || req.query.logo || '',
      thumbnail: registryMeta?.thumbnail || req.query.thumbnail || '',
    });

    tokenLogoCache.set(cacheKey, {
      ...response,
      expiresAt: Date.now() + TOKEN_LOGO_CACHE_TTL_MS,
    });

    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', response.contentType);
    res.setHeader('X-Token-Logo-Source', response.source);
    res.send(response.body);
  } catch (err) {
    console.error('[token-logo]', err.message);
    const fallback = buildFallbackLogoResponse({ tokenAddress, symbol, name, label, key: requestedKey });
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', fallback.contentType);
    res.setHeader('X-Token-Logo-Source', fallback.source);
    res.send(fallback.body);
  }
});

// ─── Static files ──────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '.')));

// ─── GET /api/portfolio ───────────────────────────────────────────────────
app.get('/api/portfolio', async (_req, res) => {
  try {
    const report = await buildPortfolioReport();
    res.json({
      success: true,
      wallet: report.wallet,
      items: report.rows,
      capitalRmb: report.capitalRmb,
      capitalUsd: report.capitalUsd,
      inputPoolRmb: report.inputPoolRmb,
      inputPoolUsd: report.inputPoolUsd,
      valuePoolUsd: report.valuePoolUsd,
      valuePoolRmb: report.valuePoolRmb,
      totalCost: report.totalCost,
      totalCostRmb: report.totalCostRmb,
      totalCostUsd: report.totalCostUsd,
      totalMarketValue: report.totalMarketValue,
      totalMarketValueRmb: report.totalMarketValueRmb,
      totalMarketValueUsd: report.totalMarketValueUsd,
      totalPnl: report.totalPnl,
      totalPnlUsd: report.totalPnlUsd,
      totalPnlRmb: report.totalPnlRmb,
      totalPnlPct: report.totalPnlPct,
      totalPnlCny: report.totalPnlCny,
      forexRate: report.forexRate,
      source: 'database',
      dataSource: 'moralis',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[portfolio]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/win-or-not/history ─────────────────────────────────────────
app.get('/api/win-or-not/history', async (_req, res) => {
  try {
    const history = await loadWinOrNotHistory();
    res.json({
      success: true,
      items: history,
      count: history.length,
      source: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[win-or-not]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/stocks ───────────────────────────────────────────────────────
app.get('/api/stocks', async (_req, res) => {
  try {
    const report = await buildPortfolioReport();
    const data = {};
    report.rows.forEach(row => {
      data[row.ticker] = {
        price: row.price,
        marketValue: row.marketValue,
        balance: row.balance,
        symbol: row.tokenSymbol,
        name: row.tokenName,
        logo: row.logo,
      };
    });

    res.json({ success: true, data, wallet: report.wallet, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[stocks]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/forex ────────────────────────────────────────────────────────
app.get('/api/forex', async (_req, res) => {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const body = await r.json();
    res.json({
      success: true,
      rate:    body.rates.CNY,
      updated: body.time_last_update_utc,
    });
  } catch (err) {
    console.error('[forex]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/news', async (_req, res) => {
  try {
    const items = await fetchWscnNews(3);
    if (items.length) {
      return res.json({ success: true, items });
    }
  } catch (err) {
    console.error('[news] WSCN:', err.message);
  }

  res.status(503).json({ success: false, error: 'WallstreetCN news unavailable' });
});

// ─── GET /api/china-map (server-side fallback proxy) ─────────────────────
app.get('/api/china-map', async (_req, res) => {
  const mapSources = [
    'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
    'https://fastly.jsdelivr.net/npm/echarts@5/map/json/china.json',
    'https://unpkg.com/echarts@5/map/json/china.json',
  ];

  for (const url of mapSources) {
    try {
      const geojson = await fetchJsonWithUA(url);
      return res.json({ success: true, source: url, geojson });
    } catch (err) {
      console.error('[china-map]', url, err.message);
    }
  }

  return res.status(503).json({
    success: false,
    error: 'All china map sources unavailable',
  });
});

// ─── GET /api/notbot/cards ────────────────────────────────────────────────
async function loadNotbotCards() {
  const rarities = await prisma.cardRarityConfig.findMany({
    orderBy: { probability: 'asc' },
    include: { cards: true },
  });

  const rarityConfig = {};
  const cards = [];

  for (const r of rarities) {
    rarityConfig[r.name] = { color: r.color, probability: r.probability };
    for (const c of r.cards) {
      cards.push({
        id: c.id,
        title: c.title,
        text: c.text,
        image: c.image,
        rarity: c.rarityName,
      });
    }
  }

  return { rarityConfig, cards };
}

app.get('/api/notbot/cards', async (_req, res) => {
  try {
    const data = await loadNotbotCards();
    res.json({
      success: true,
      rarityConfig: data.rarityConfig,
      cards: data.cards,
      source: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[notbot]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/mail/send-now ───────────────────────────────────────────────
app.get('/api/mail/send-now', async (req, res) => {
  try {
    if (!MAIL_CONFIG.testToken || req.query.token !== MAIL_CONFIG.testToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized token' });
    }
    const result = await sendPortfolioEmail('manual');
    res.json({ success: true, result });
  } catch (err) {
    console.error('[mail]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Daily mail schedule (07:30 in Asia/Shanghai) ────────────────────────
cron.schedule('30 7 * * *', async () => {
  try {
    await sendPortfolioEmail('cron');
  } catch (err) {
    console.error('[mail-cron]', err.message);
  }
}, { timezone: EMAIL_TIMEZONE });

console.log(`[mail-cron] scheduled at 07:30 (${EMAIL_TIMEZONE})`);

// ─── Daily PnL record schedule (06:00 in Asia/Shanghai) ───────────────────
cron.schedule('0 6 * * *', async () => {
  try {
    const result = await appendWinOrNotRecord('cron');
    console.log(`[win-or-not-cron] recorded: ${result.totalPnlPct.toFixed(2)}%`);
  } catch (err) {
    console.error('[win-or-not-cron]', err.message);
  }
}, { timezone: EMAIL_TIMEZONE });

console.log(`[win-or-not-cron] scheduled at 06:00 (${EMAIL_TIMEZONE})`);

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nShareyee running at http://localhost:${PORT}\n`);
});

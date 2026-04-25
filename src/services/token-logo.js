// Token Logo 服务

import { fetchJsonWithUA, fetchRemoteImage } from '../utils/fetch.js';
import { normalizeAddress, normalizeLookupKey, isHttpUrl, hashString, escapeXml } from '../utils/text.js';

export const TOKEN_LOGO_TIMEOUT_MS = 3000;
export const TOKEN_LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const tokenLogoRegistry = new Map();
export const tokenLogoCache = new Map();

export const WEB3_CHAIN_LABELS = {
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

export function chainLabelFromValue(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return WEB3_CHAIN_LABELS[key] || WEB3_CHAIN_LABELS[key.replace(/^0x/, '')] || String(value ?? '').toUpperCase();
}

export function buildFallbackLogoResponse(meta = {}) {
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

export async function resolveTokenLogoResponse(meta = {}) {
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

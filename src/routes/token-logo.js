// Token Logo 路由

import { Router } from 'express';
import {
  tokenLogoRegistry,
  tokenLogoCache,
  resolveTokenLogoResponse,
  buildFallbackLogoResponse,
  TOKEN_LOGO_CACHE_TTL_MS,
} from '../services/token-logo.js';
import { normalizeAddress, normalizeLookupKey, isHttpUrl } from '../utils/text.js';

export const tokenLogoRouter = Router();

tokenLogoRouter.get('/:key', async (req, res) => {
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

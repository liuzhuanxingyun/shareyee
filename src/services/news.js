// 新闻服务

import { fetchJsonWithUA, NEWS_TIMEOUT_MS } from '../utils/fetch.js';
import { cleanText, isHttpUrl } from '../utils/text.js';
import { toIsoTimestamp } from './helpers.js';

export function normalizeWscnSummary(item, title = '') {
  const raw = item?.content_text || item?.content || item?.reference || '';
  const text = cleanText(raw).replace(/\s+/g, ' ').trim();
  if (!text) return title;
  return text.slice(0, 180);
}

export function normalizeWscnLink(item) {
  if (isHttpUrl(item?.uri)) return String(item.uri).trim();
  if (item?.id) return `https://wallstreetcn.com/livenews/${item.id}`;
  return 'https://wallstreetcn.com/livenews';
}

export async function fetchWscnNews(limit = 3) {
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

// 新闻路由

import { Router } from 'express';
import { fetchWscnNews } from '../services/news.js';

export const newsRouter = Router();

newsRouter.get('/', async (_req, res) => {
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

// 盈亏历史路由

import { Router } from 'express';
import { loadWinOrNotHistory } from '../services/portfolio.js';

export const pnlRouter = Router();

pnlRouter.get('/history', async (_req, res) => {
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

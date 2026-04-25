// 股票路由

import { Router } from 'express';
import { buildPortfolioReport } from '../services/portfolio.js';

export const stocksRouter = Router();

stocksRouter.get('/', async (_req, res) => {
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

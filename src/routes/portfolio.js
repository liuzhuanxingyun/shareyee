// 投资组合路由

import { Router } from 'express';
import { buildPortfolioReport } from '../services/portfolio.js';

export const portfolioRouter = Router();

portfolioRouter.get('/', async (_req, res) => {
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

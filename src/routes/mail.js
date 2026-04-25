// 邮件路由

import { Router } from 'express';
import { MAIL_CONFIG, sendPortfolioEmail } from '../services/mail.js';
import { buildPortfolioReport } from '../services/portfolio.js';

export const mailRouter = Router();

mailRouter.get('/send-now', async (req, res) => {
  try {
    if (!MAIL_CONFIG.testToken || req.query.token !== MAIL_CONFIG.testToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized token' });
    }
    const report = await buildPortfolioReport();
    const result = await sendPortfolioEmail(report, 'manual');
    res.json({ success: true, result });
  } catch (err) {
    console.error('[mail]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

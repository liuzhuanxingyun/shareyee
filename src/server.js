// Shareyee 主入口
// 个人作品集与投资看板

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';

import { portfolioRouter } from './routes/portfolio.js';
import { pnlRouter } from './routes/pnl.js';
import { stocksRouter } from './routes/stocks.js';
import { newsRouter } from './routes/news.js';
import { forexRouter } from './routes/forex.js';
import { chinaMapRouter } from './routes/china-map.js';
import { tokenLogoRouter } from './routes/token-logo.js';
import { notbotRouter } from './routes/notbot.js';
import { calendarRouter } from './routes/calendar.js';
import { mailRouter } from './routes/mail.js';
import { MAIL_CONFIG, sendPortfolioEmail } from './services/mail.js';
import { appendWinOrNotRecord } from './services/portfolio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const EMAIL_TIMEZONE = 'Asia/Shanghai';

// API 路由
app.use('/api/portfolio', portfolioRouter);
app.use('/api/win-or-not', pnlRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/news', newsRouter);
app.use('/api/forex', forexRouter);
app.use('/api/china-map', chinaMapRouter);
app.use('/api/token-logo', tokenLogoRouter);
app.use('/api/notbot', notbotRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/mail', mailRouter);

// 静态文件
app.use(express.static(join(__dirname, '..', 'public')));

// 定时任务：每日邮件 (07:30 北京时间)
cron.schedule('30 7 * * *', async () => {
  try {
    const { buildPortfolioReport } = await import('./services/portfolio.js');
    const report = await buildPortfolioReport();
    await sendPortfolioEmail(report, 'cron');
  } catch (err) {
    console.error('[mail-cron]', err.message);
  }
}, { timezone: EMAIL_TIMEZONE });

console.log(`[mail-cron] scheduled at 07:30 (${EMAIL_TIMEZONE})`);

// 定时任务：每日盈亏记录 (06:00 北京时间)
cron.schedule('0 6 * * *', async () => {
  try {
    const result = await appendWinOrNotRecord('cron');
    console.log(`[win-or-not-cron] recorded: ${result.totalPnlPct.toFixed(2)}%`);
  } catch (err) {
    console.error('[win-or-not-cron]', err.message);
  }
}, { timezone: EMAIL_TIMEZONE });

console.log(`[win-or-not-cron] scheduled at 06:00 (${EMAIL_TIMEZONE})`);

// 启动服务器
app.listen(PORT, () => {
  console.log(`\nShareyee running at http://localhost:${PORT}\n`);
});

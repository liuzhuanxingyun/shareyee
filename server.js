import express            from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Parser            from 'rss-parser';
import cron              from 'node-cron';
import nodemailer        from 'nodemailer';
import dotenv            from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const rss  = new Parser();
const NEWS_TIMEOUT_MS = 6000;
const EMAIL_TIMEZONE = 'Asia/Shanghai';
const MAP_FETCH_TIMEOUT_MS = 8000;

const PORTFOLIO = [
  { label: 'UBERON', ticker: 'UBER', shares: 1.83047, cost: 150 },
  { label: 'TQQQON', ticker: 'TQQQ', shares: 0.47427, cost: 25 },
  { label: 'COINON', ticker: 'COIN', shares: 0.28838, cost: 50 },
  { label: 'BABAON', ticker: 'BABA', shares: 0.36844, cost: 50 },
];

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
  return Number(value).toFixed(2);
}

function signedMoney(value, unit = '$') {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${unit}${Math.abs(value).toFixed(2)}`;
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

async function buildPortfolioReport() {
  const prices = await Promise.all(PORTFOLIO.map(item => stooqPrice(item.ticker)));
  const forexRate = await getForexRate();

  const rows = PORTFOLIO.map((item, idx) => {
    const price = prices[idx];
    const mkt = price !== null ? price * item.shares : null;
    const pnl = mkt !== null ? mkt - item.cost : null;
    const pnlPct = pnl !== null ? (pnl / item.cost) * 100 : null;
    return {
      ...item,
      avg: item.cost / item.shares,
      price,
      marketValue: mkt,
      pnl,
      pnlPct,
    };
  });

  const totalCost = PORTFOLIO.reduce((sum, item) => sum + item.cost, 0);
  const totalMarketValue = rows.reduce((sum, row) => sum + (row.marketValue || 0), 0);
  const totalPnl = totalMarketValue - totalCost;
  const totalPnlPct = (totalPnl / totalCost) * 100;

  return {
    rows,
    forexRate,
    totalCost,
    totalMarketValue,
    totalPnl,
    totalPnlPct,
    totalPnlCny: totalPnl * forexRate,
    generatedAt: new Date().toISOString(),
  };
}

function buildMailHtml(report) {
  const rowsHtml = report.rows.map(row => {
    const price = row.price !== null ? `$${f2(row.price)}` : 'N/A';
    const pnl = row.pnl !== null ? signedMoney(row.pnl, '$') : 'N/A';
    const pnlPct = row.pnlPct !== null ? `${row.pnlPct >= 0 ? '+' : ''}${f2(row.pnlPct)}%` : 'N/A';
    return `<tr>
      <td>${row.label} (${row.ticker})</td>
      <td>${row.shares.toFixed(5)}</td>
      <td>$${f2(row.avg)}</td>
      <td>${price}</td>
      <td>${pnl}</td>
      <td>${pnlPct}</td>
    </tr>`;
  }).join('');

  return `
    <h2>Shareyee 持仓日报</h2>
    <p>生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN', { timeZone: EMAIL_TIMEZONE })}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead>
        <tr>
          <th>资产</th><th>份额</th><th>平均成本</th><th>当前价</th><th>盈亏(USD)</th><th>盈亏比例</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p>总投入: $${f2(report.totalCost)}</p>
    <p>当前市值: $${f2(report.totalMarketValue)}</p>
    <p>总盈亏(USD): ${signedMoney(report.totalPnl, '$')} (${report.totalPnlPct >= 0 ? '+' : ''}${f2(report.totalPnlPct)}%)</p>
    <p>汇率: 1 USD = ${f2(report.forexRate)} CNY</p>
    <p>总盈亏(CNY): ${signedMoney(report.totalPnlCny, 'CNY ')}</p>
  `;
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
  await mailTransporter.sendMail({
    from: MAIL_CONFIG.from,
    to: MAIL_CONFIG.to,
    subject: `Shareyee 持仓盈亏日报 (${new Date().toLocaleDateString('zh-CN', { timeZone: EMAIL_TIMEZONE })})`,
    html: buildMailHtml(report),
  });

  console.log(`[mail] sent (${reason}) to ${MAIL_CONFIG.to}`);
  return { sent: true, reason, generatedAt: report.generatedAt };
}

// ─── Static files ──────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '.')));

// ─── GET /api/stocks ───────────────────────────────────────────────────────
app.get('/api/stocks', async (_req, res) => {
  const tickers = ['UBER', 'TQQQ', 'COIN', 'BABA'];
  try {
    const prices = await Promise.all(tickers.map(stooqPrice));

    const data = {};
    tickers.forEach((t, i) => { data[t] = { price: prices[i] }; });

    res.json({ success: true, data, timestamp: new Date().toISOString() });
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

// ─── GET /api/news ─────────────────────────────────────────────────────────
const NEWS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',  source: 'BBC World'  },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NY Times' },
  { url: 'https://hnrss.org/frontpage',                  source: 'Hacker News' },
];

app.get('/api/news', async (_req, res) => {
  for (const feed of NEWS_FEEDS) {
    try {
      const parsed = await Promise.race([
        rss.parseURL(feed.url),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('RSS timeout')), NEWS_TIMEOUT_MS);
        }),
      ]);
      const items  = parsed.items.slice(0, 3).map(item => ({
        title:   item.title,
        summary: item.contentSnippet || item.content || '',
        link:    item.link,
        pubDate: item.pubDate,
        source:  feed.source,
      }));
      return res.json({ success: true, items });
    } catch (err) {
      console.error(`[news] ${feed.source}:`, err.message);
    }
  }
  res.status(503).json({ success: false, error: 'All news feeds unavailable' });
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

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nShareyee running at http://localhost:${PORT}\n`);
});

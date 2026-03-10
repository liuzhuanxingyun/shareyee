import express            from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Parser            from 'rss-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const rss  = new Parser();
const NEWS_TIMEOUT_MS = 6000;

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

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nShareyee running at http://localhost:${PORT}\n`);
});

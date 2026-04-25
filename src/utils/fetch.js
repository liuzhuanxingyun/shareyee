// 网络请求工具函数

export const DEFAULT_TIMEOUT_MS = 8000;
export const NEWS_TIMEOUT_MS = 6000;

export async function fetchJsonWithUA(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Shareyee proxy)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchTextWithUA(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Shareyee proxy)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRemoteImage(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Shareyee token logo proxy)',
        Accept: 'image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected content-type ${contentType || 'unknown'}`);
    }

    return {
      body: Buffer.from(await res.arrayBuffer()),
      contentType: contentType || 'image/png',
      source: url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getForexRate() {
  const r = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const body = await r.json();
  return body.rates.CNY;
}

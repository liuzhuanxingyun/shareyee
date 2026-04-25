// 文本处理工具函数

export function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function cleanText(value) {
  return decodeHtmlEntities(String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

export function stripHtml(html) {
  return cleanText(String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' '));
}

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeLookupKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^A-Z0-9.]/g, '');
}

export function normalizeAddress(value) {
  const address = String(value ?? '').trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(address) ? address : '';
}

export function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value ?? '').trim());
}

export function hashString(value) {
  let hash = 0;
  for (const char of String(value ?? '')) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

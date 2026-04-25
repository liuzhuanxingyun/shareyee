// 辅助函数

export function toIsoTimestamp(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    const ms = number > 1e12 ? number : number * 1000;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function extractMetaContent(html, names) {
  for (const name of names) {
    const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = String(html ?? '').match(pattern);
      if (match?.[1]) {
        return String(match[1])
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }

  return null;
}

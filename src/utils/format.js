// 格式化工具函数

export function f2(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '--';
}

export function signedMoney(value, unit = '$') {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'N/A';
  const sign = number >= 0 ? '+' : '-';
  return `${sign}${unit}${Math.abs(number).toFixed(2)}`;
}

export function formatQuantity(value) {
  if (!Number.isFinite(value)) return '--';
  if (value === 0) return '0.00000';
  return value.toFixed(5);
}

export function toNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function chinaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function chinaYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}${map.month}`;
}

export function previousChinaYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  let year = Number(map.year);
  let month = Number(map.month) - 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `${year}${String(month).padStart(2, '0')}`;
}

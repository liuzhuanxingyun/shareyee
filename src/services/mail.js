// 邮件服务

import nodemailer from 'nodemailer';
import { f2, signedMoney, chinaDateString } from '../utils/format.js';

const EMAIL_TIMEZONE = 'Asia/Shanghai';

export const MAIL_CONFIG = {
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

export const mailTransporter = nodemailer.createTransport({
  host: MAIL_CONFIG.host,
  port: MAIL_CONFIG.port,
  secure: MAIL_CONFIG.secure,
  auth: {
    user: MAIL_CONFIG.user,
    pass: MAIL_CONFIG.pass,
  },
});

export function buildMailHtml(report, walletAddress, chainLabel) {
  const rowsHtml = report.rows.map(row => {
    const cost = row.cost !== null ? `$${f2(row.cost)}` : 'N/A';
    const price = row.price !== null ? `$${f2(row.price)}` : 'N/A';
    const balance = Number.isFinite(row.balance) ? row.balance.toFixed(5) : 'N/A';
    const pnl = row.pnl !== null ? signedMoney(row.pnl, '$') : 'N/A';
    const pnlPct = Number.isFinite(row.pnlPct) ? `${row.pnlPct >= 0 ? '+' : ''}${f2(row.pnlPct)}%` : 'N/A';
    return `<tr>
      <td>${row.label} (${row.ticker})</td>
      <td>${balance}</td>
      <td>${cost}</td>
      <td>${row.avg !== null ? `$${f2(row.avg)}` : 'N/A'}</td>
      <td>${price}</td>
      <td>${pnl}</td>
      <td>${pnlPct}</td>
    </tr>`;
  }).join('');

  return `
    <h2>Shareyee 持仓日报</h2>
    <p>只读钱包: ${walletAddress} · ${chainLabel} · ${report.wallet.tokenCount} 个代币</p>
    <p>生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN', { timeZone: EMAIL_TIMEZONE })}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead>
        <tr>
          <th>资产</th><th>数量</th><th>投入成本</th><th>平均成本</th><th>当前价</th><th>盈亏(USD)</th><th>盈亏比例</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p>投入池: ¥${f2(report.inputPoolRmb)} / $${f2(report.inputPoolUsd)}</p>
    <p>价值池: ¥${f2(report.valuePoolRmb)} / $${f2(report.valuePoolUsd)}</p>
    <p>浮动盈亏(CNY): ${signedMoney(report.totalPnlRmb, 'CNY ')} (${Number.isFinite(report.totalPnlPct) ? `${report.totalPnlPct >= 0 ? '+' : ''}${f2(report.totalPnlPct)}%` : 'N/A'})</p>
    <p>浮动盈亏(USD): ${signedMoney(report.totalPnl, '$')}</p>
    <p>汇率: 1 USD = ${f2(report.forexRate)} CNY</p>
  `;
}

export async function sendPortfolioEmail(report, reason = 'scheduled') {
  if (!MAIL_CONFIG.enabled) {
    console.log('[mail] skipped: MAIL_ENABLED is not 1');
    return { sent: false, reason: 'disabled' };
  }
  if (!MAIL_CONFIG.pass) {
    throw new Error('MAIL_PASS is empty, please set QQ SMTP auth code');
  }

  const mailDate = new Intl.DateTimeFormat('zh-CN', {
    timeZone: EMAIL_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(report.generatedAt));

  const { WEB3_WALLET_ADDRESS } = await import('./wallet.js');
  const { chainLabelFromValue } = await import('./token-logo.js');

  await mailTransporter.sendMail({
    from: MAIL_CONFIG.from,
    to: MAIL_CONFIG.to,
    subject: `Shareyee 持仓盈亏日报 (${mailDate}) 总盈亏：${signedMoney(report.totalPnlRmb, 'CNY ')}`,
    html: buildMailHtml(report, WEB3_WALLET_ADDRESS, chainLabelFromValue(process.env.WEB3_CHAIN || 'bsc')),
  });

  console.log(`[mail] sent (${reason}) to ${MAIL_CONFIG.to}`);
  return { sent: true, reason, generatedAt: report.generatedAt };
}

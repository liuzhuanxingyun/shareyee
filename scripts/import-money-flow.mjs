import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

// CSV 文件路径
const CSV_FILE = process.argv[2] || 'Binance-C2C-订单历史记录-202604260452(UTC+8).csv';

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record = {};
    headers.forEach((h, i) => {
      record[h.trim()] = values[i]?.trim() || '';
    });
    return record;
  });
}

function parseDateTime(str) {
  // 格式: 26-01-06 21:25:46 -> 2026-01-06 21:25:46
  const match = str.match(/(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error(`无法解析日期: ${str}`);
  }
  const [, yy, mm, dd, hh, mi, ss] = match;
  return new Date(`20${yy}-${mm}-${dd}T${hh}:${mi}:${ss}+08:00`);
}

async function main() {
  const csvPath = path.resolve(process.cwd(), CSV_FILE);

  if (!fs.existsSync(csvPath)) {
    console.error(`文件不存在: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(content);

  console.log(`找到 ${records.length} 条记录`);

  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    const orderId = record['订单编号'];

    // 检查是否已存在
    const existing = await prisma.moneyFlow.findUnique({
      where: { orderId },
    });

    if (existing) {
      console.log(`跳过已存在: ${orderId}`);
      skipped++;
      continue;
    }

    const fiatAmount = parseFloat(record['总价格']) || 0;
    const unitPrice = parseFloat(record['价格']) || 0;
    const assetAmount = parseFloat(record['数量']) || 0;

    await prisma.moneyFlow.create({
      data: {
        orderId,
        orderType: record['订单类型'],
        asset: record['资产'],
        fiatCurrency: record['法币类型'],
        fiatAmount,
        unitPrice,
        assetAmount,
        counterparty: record['交易对手'] || null,
        status: record['状态'],
        occurredAt: parseDateTime(record['创建时间']),
      },
    });

    console.log(`导入: ${orderId} - ${record['订单类型']} ${assetAmount} ${record['资产']} @ ${unitPrice} ${record['法币类型']}`);
    imported++;
  }

  console.log(`\n完成! 导入 ${imported} 条, 跳过 ${skipped} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

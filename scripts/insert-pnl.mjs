import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

async function main() {
  const record = await prisma.pnlHistory.upsert({
    where: { date: '2026-04-18' },
    update: {
      recordedAt: new Date('2026-04-17T22:00:01.670Z'),
      timezone: 'Asia/Shanghai',
      trigger: 'cron',
      totalCost: 492.67,
      totalMarketValue: 529.93,
      totalPnl: 25.93,
      totalPnlPct: 5.1451,
      totalPnlCny: 177.24,
      forexRate: 6.835025,
      win: true,
    },
    create: {
      date: '2026-04-18',
      recordedAt: new Date('2026-04-17T22:00:01.670Z'),
      timezone: 'Asia/Shanghai',
      trigger: 'cron',
      totalCost: 492.67,
      totalMarketValue: 529.93,
      totalPnl: 25.93,
      totalPnlPct: 5.1451,
      totalPnlCny: 177.24,
      forexRate: 6.835025,
      win: true,
    },
  });

  console.log('Inserted/updated PnlHistory:', record.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// NotBot 卡片路由

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const notbotRouter = Router();

async function loadNotbotCards() {
  const rarities = await prisma.cardRarityConfig.findMany({
    orderBy: { probability: 'asc' },
    include: { cards: true },
  });

  const rarityConfig = {};
  const cards = [];

  for (const r of rarities) {
    rarityConfig[r.name] = { color: r.color, probability: r.probability };
    for (const c of r.cards) {
      cards.push({
        id: c.id,
        title: c.title,
        text: c.text,
        image: c.image,
        rarity: c.rarityName,
      });
    }
  }

  return { rarityConfig, cards };
}

notbotRouter.get('/cards', async (_req, res) => {
  try {
    const data = await loadNotbotCards();
    res.json({
      success: true,
      rarityConfig: data.rarityConfig,
      cards: data.cards,
      source: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[notbot]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

const data = {
  "version": 1,
  "updatedAt": "2026-04-05",
  "rarityConfig": {
    "有趣": {
      "color": "#22c55e",
      "probability": 80
    },
    "特别": {
      "color": "#3b82f6",
      "probability": 16
    },
    "惊喜": {
      "color": "#f59e0b",
      "probability": 3.2
    },
    "人生": {
      "color": "#ef4444",
      "probability": 0.8
    }
  },
  "cards": [
    {
      "id": "NB-001",
      "title": "来到长城",
      "text": "有道是：不到长城非好汉。今日来此，一眼千年",
      "image": "assets/img/notbot/IMG_4945.jpeg",
      "rarity": "人生"
    },
    {
      "id": "NB-002",
      "title": "黑脸奶龙",
      "text": "一只在商场发现的黑脸奶龙，看来深受孩子欢迎",
      "image": "assets/img/notbot/IMG_3967.jpeg",
      "rarity": "有趣"
    },
    {
      "id": "NB-003",
      "title": "小狗",
      "text": "一只偶尔遇见的小狗，眼神中透露出一丝忧郁",
      "image": "assets/img/notbot/IMG_5518.jpeg",
      "rarity": "特别"
    },
    {
      "id": "NB-004",
      "title": "摔跤",
      "text": "摔了个大的，脑袋晕乎乎的",
      "image": "assets/img/notbot/IMG_5837.jpeg",
      "rarity": "有趣"
    }
  ]
};

async function main() {
  const { rarityConfig, cards } = data;

  for (const [name, cfg] of Object.entries(rarityConfig)) {
    await prisma.cardRarityConfig.upsert({
      where: { name },
      update: { color: cfg.color, probability: cfg.probability },
      create: { name, color: cfg.color, probability: cfg.probability },
    });
  }

  for (const card of cards) {
    await prisma.cardItem.upsert({
      where: { id: card.id },
      update: {
        title: card.title,
        text: card.text,
        image: card.image,
        rarityName: card.rarity,
      },
      create: {
        id: card.id,
        title: card.title,
        text: card.text,
        image: card.image,
        rarityName: card.rarity,
      },
    });
  }

  console.log(`Seeded ${Object.keys(rarityConfig).length} rarities and ${cards.length} cards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

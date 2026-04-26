import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const data = {
  "version": 1,
  "updatedAt": "2026-04-26",
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
      "title": "吃饭",
      "text": "和同事吃饭",
      "image": "assets/img/notbot/NB-001.jpg",
      "rarity": "有趣"
    },
    {
      "id": "NB-002",
      "title": "划船",
      "text": "在猎德看到的，第一次看到有人玩这种运动",
      "image": "assets/img/notbot/NB-002.jpg",
      "rarity": "有趣"
    },
    {
      "id": "NB-003",
      "title": "无人驾驶",
      "text": "打了一辆车外出，但是似乎没有司机......",
      "image": "assets/img/notbot/NB-003.jpg",
      "rarity": "有趣"
    },
    {
      "id": "NB-004",
      "title": "低空经济",
      "text": "听说可以从大学城回肇庆只需要200多......",
      "image": "assets/img/notbot/NB-004.jpg",
      "rarity": "有趣"
    },
    {
      "id": "NB-005",
      "title": "加班夜",
      "text": "好像是第一次加班到这么晚",
      "image": "assets/img/notbot/NB-005.jpg",
      "rarity": "有趣"
    },
    {
      "id": "NB-006",
      "title": "小狗",
      "text": "它不属于我，它只是刚好经过",
      "image": "assets/img/notbot/NB-006.jpg",
      "rarity": "特别"
    },
    {
      "id": "NB-007",
      "title": "来到长城",
      "text": "终于到达了，我也是好汉了......吗？",
      "image": "assets/img/notbot/NB-007.jpg",
      "rarity": "惊喜"
    },
    {
      "id": "NB-008",
      "title": "超英派遣中心",
      "text": "一种忽然找到良作的欣喜油然而生，可惜流程太短，首发居然还不是完整内容",
      "image": "assets/img/notbot/NB-008.jpg",
      "rarity": "特别"
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

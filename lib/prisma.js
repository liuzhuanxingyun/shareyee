import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Prisma 7.x 使用 adapter 方式连接数据库
const globalForPrisma = globalThis;

const createPrismaClient = () => {
  // 解析 DATABASE_URL
  const url = new URL(process.env.DATABASE_URL);
  const pool = new pg.Pool({
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1), // 去掉前导 /
    user: url.username,
    password: url.password || undefined,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

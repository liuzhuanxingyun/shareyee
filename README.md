# Shareyee

曾展鹏的个人作品集与投资看板。

## 快速开始

### 1. 安装 PostgreSQL

- Windows: 下载 [PostgreSQL 安装包](https://www.postgresql.org/download/windows/)
- 或使用 Docker: `docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`

### 2. 创建数据库

```bash
psql -U postgres
CREATE DATABASE shareyee;
```

### 3. 配置环境变量

创建 `.env` 文件：

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/shareyee"
```

### 4. 安装依赖并初始化数据库

```bash
npm install
npm run db:migrate    # 运行数据库迁移
npm run db:generate   # 生成 Prisma Client
npm start
```

访问 http://localhost:3000

## 文档

- [项目说明](docs/README.md)
- [架构文档](docs/ARCHITECTURE.md)
- [VPS 部署指南](docs/VNC部署指南.md)

## 功能

- 个人信息展示
- 投资看板（钱包同步、盈亏统计、定时邮件）
- 兴趣生活（音乐、地图）
- 日历板块（健身、学习记录）

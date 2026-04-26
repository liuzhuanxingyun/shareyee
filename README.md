# Shareyee

曾展鹏的个人作品集与投资看板

**在线访问**: http://shareyee.duckdns.org

## 功能

- 个人信息展示
- 投资看板（钱包同步、盈亏统计、定时邮件）
- 稀有化抽卡
- 兴趣生活（音乐、地图）
- 日历板块（健身、学习记录）

## 本地开发

### 1. 安装 PostgreSQL

- Windows: 下载 [PostgreSQL 安装包](https://www.postgresql.org/download/windows/)
- 或 Docker: `docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`

### 2. 创建数据库

```bash
psql -U postgres
CREATE DATABASE shareyee;
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写真实配置
```

### 4. 安装依赖并启动

```bash
npm install
npm run db:migrate
npm start
```

访问 http://localhost:3000

## VPS 部署

### 一键部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/your/shareyee.git
cd shareyee

# 2. 运行部署脚本（需要 root）
sudo ./scripts/deploy.sh

# 3. 编辑 .env 填写真实配置
nano .env

# 4. 重启应用
pm2 restart shareyee
```

### 手动部署

1. 安装 Node.js 20 + PostgreSQL
2. 创建数据库和用户
3. 配置 `.env`
4. `npm install && npx prisma migrate deploy`
5. `pm2 start scripts/ecosystem.config.cjs`

### 常用命令

```bash
pm2 logs shareyee      # 查看日志
pm2 restart shareyee   # 重启
pm2 stop shareyee      # 停止
pm2 startup            # 开机自启
```

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@localhost:5432/shareyee` |
| `MAIL_ENABLED` | 邮件开关 | `1` 或 `0` |
| `MAIL_USER` | QQ 邮箱地址 | `xxx@qq.com` |
| `MAIL_PASS` | QQ SMTP 授权码 | `abcdefghijklmnop` |
| `WEB3_WALLET_ADDRESS` | 钱包地址 | `0x5920...` |
| `MORALIS_API_KEY` | Moralis API 密钥 | `eyJhbGci...` |

## 数据库管理

```bash
npm run db:studio    # 打开 Prisma Studio 可视化管理
```

### 添加持仓

在 Prisma Studio 中编辑 `crypto_item` 表：

| 字段 | 说明 |
|------|------|
| label | 显示名称 |
| ticker | 代币代码 |
| cost | 投入成本（USD） |
| enabled | 是否启用 |

## 技术栈

- **后端**: Express.js + Prisma + PostgreSQL
- **前端**: 原生 HTML/CSS/JS
- **进程管理**: PM2
- **Web3**: Moralis API

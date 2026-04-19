#!/bin/bash
set -e

echo "===================================="
echo "  Shareyee VPS 一键部署脚本"
echo "===================================="

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "   请安装 Node.js 20+ : https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低: $(node -v)，需要 18+"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 2. 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi
echo "✅ npm $(npm -v)"

# 3. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi
echo "✅ PM2 $(pm2 -v)"

# 4. 安装项目依赖
echo "📦 安装依赖..."
npm install

# 5. 检查 .env
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env 文件不存在"
    echo "    请复制 .env.example 为 .env，并填写配置"
    echo "    关键配置项:"
    echo "      - DATABASE_URL (PostgreSQL 连接字符串)"
    echo "      - MAIL_USER / MAIL_PASS (邮件功能)"
    echo "      - MORALIS_API_KEY (钱包同步)"
    exit 1
fi
echo "✅ .env 已配置"

# 5.5 加载 .env 到环境变量（Prisma CLI 需要）
echo "📦 加载环境变量..."
while IFS='=' read -r key value; do
    key=$(echo "$key" | sed 's/[[:space:]]//g')
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    export "$key=$value"
done < .env

# 6. Prisma
echo "📦 Prisma generate..."
npx prisma generate

echo "📦 Prisma migrate deploy..."
npx prisma migrate deploy

# 7. PM2 启动/重启
echo "🚀 启动应用..."
pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs

# 8. 保存 PM2 配置，确保重启后自动恢复
pm2 save

# 9. 提示设置开机自启（可能需要 sudo）
echo ""
echo "===================================="
echo "  ✅ 部署完成!"
echo "===================================="
echo ""
pm2 status

echo ""
echo "💡 提示:"
echo "   - 应用运行在 http://localhost:3000"
echo "   - 查看日志: pm2 logs shareyee"
echo "   - 停止应用: pm2 stop shareyee"
echo "   - 重启应用: pm2 restart shareyee"
echo ""
echo "   如需开机自启，请运行:"
echo "   pm2 startup && sudo env PATH=\$PATH:\$(dirname \$(which node)) pm2 startup systemd -u \$USER --hp \$HOME"

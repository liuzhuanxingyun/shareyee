#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "===================================="
echo "  Shareyee VPS 全自动部署脚本"
echo "===================================="

# 0. 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请用 root 权限运行： sudo ./deploy.sh${NC}"
    exit 1
fi

# 1. 自动安装 Node.js
install_node() {
    echo "📦 正在安装 Node.js 20..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    else
        echo -e "${RED}❌ 无法自动安装 Node.js${NC}"
        exit 1
    fi
}

if ! command -v node &> /dev/null; then
    install_node
else
    NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        install_node
    fi
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# 2. 自动安装 PostgreSQL
install_postgres() {
    echo "📦 正在安装 PostgreSQL..."
    if command -v apt-get &> /dev/null; then
        apt-get update -qq
        apt-get install -y postgresql postgresql-contrib
        service postgresql start
    elif command -v yum &> /dev/null; then
        yum install -y postgresql-server postgresql-contrib
        postgresql-setup initdb
        systemctl start postgresql
        systemctl enable postgresql
    else
        echo -e "${RED}❌ 无法自动安装 PostgreSQL${NC}"
        exit 1
    fi
}

if ! command -v psql &> /dev/null; then
    install_postgres
else
    echo -e "${GREEN}✅ PostgreSQL 已安装${NC}"
fi

# 确保 PostgreSQL 正在运行
if command -v systemctl &> /dev/null; then
    systemctl start postgresql 2>/dev/null || true
else
    service postgresql start 2>/dev/null || true
fi

# 3. 配置数据库（创建用户、数据库、授权）
setup_database() {
    DB_USER="shareyee"
    DB_PASS="Shareyee_DB_9527"
    DB_NAME="shareyee"

    echo "📦 正在配置数据库..."

    # 创建用户（忽略已存在的错误）
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true

    # 创建数据库
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true

    # 授权
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

    # 修改 pg_hba.conf 让密码连接可用（Ubuntu/Debian）
    if command -v apt-get &> /dev/null; then
        PG_VERSION=$(ls /etc/postgresql/ | sort -V | tail -1)
        PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
        if [ -f "$PG_HBA" ]; then
            sed -i 's/local[[:space:]]\+all[[:space:]]\+all[[:space:]]\+peer/local   all             all                                     md5/' "$PG_HBA" 2>/dev/null || true
            sed -i 's/local[[:space:]]\+all[[:space:]]\+all[[:space:]]\+scram-sha-256/local   all             all                                     md5/' "$PG_HBA" 2>/dev/null || true
            sed -i 's/host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+127.0.0.1\/32[[:space:]]\+scram-sha-256/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA" 2>/dev/null || true
            sed -i 's/host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+::1\/128[[:space:]]\+scram-sha-256/host    all             all             ::1\/128                 md5/' "$PG_HBA" 2>/dev/null || true
            service postgresql restart
        fi
    fi

    echo "$DB_PASS"
}

DB_PASS=$(setup_database)

# 4. 生成 .env（如果不存在）
if [ ! -f .env ]; then
    echo "📦 正在生成 .env 配置文件..."
    cat > .env << EOF
DATABASE_URL="postgresql://shareyee:$DB_PASS@localhost:5432/shareyee?schema=public"

# ============================================================
# 以下配置需要你手动改成真实值，否则邮件和钱包功能无法使用
# ============================================================

# 邮件功能（QQ邮箱）
MAIL_ENABLED=1
MAIL_HOST=smtp.qq.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=你的QQ邮箱@qq.com
MAIL_PASS=你的QQ邮箱授权码
MAIL_FROM=你的QQ邮箱@qq.com
MAIL_TO=接收邮箱@qq.com
MAIL_TEST_TOKEN=abc123xyz789

# 钱包同步
WEB3_WALLET_ADDRESS=0x5920efce45f6221f33c6923aa4e25951357389ca
WEB3_CHAIN=bsc
MORALIS_API_KEY=你的Moralis_API_Key
WEB3_CACHE_TTL_MS=60000
EOF
    echo -e "${YELLOW}⚠️  .env 已自动生成，但邮件和 API Key 是占位符${NC}"
fi

echo -e "${GREEN}✅ .env 已配置${NC}"

# 加载 .env
set -a
source .env
set +a

# 5. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在安装 PM2..."
    npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 $(pm2 -v)${NC}"

# 6. 安装依赖
mkdir -p logs
echo "📦 安装依赖..."
npm install

# 7. Prisma
echo "📦 Prisma generate..."
npx prisma generate

echo "📦 Prisma migrate deploy..."
npx prisma migrate deploy

# 8. PM2 启动
echo "🚀 启动应用..."
pm2 restart scripts/ecosystem.config.cjs 2>/dev/null || pm2 start scripts/ecosystem.config.cjs
pm2 save

# 9. 完成
echo ""
echo "===================================="
echo -e "  ${GREEN}✅ 部署完成！${NC}"
echo "===================================="
echo ""
pm2 status
echo ""
echo -e "${GREEN}💡 应用运行在 http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  重要提醒：${NC}"
echo "   1. 请编辑 .env 文件，把邮件和 API Key 换成真实的"
echo "   2. 如果浏览器无法访问，请检查防火墙是否放行 3000 端口："
if command -v ufw &> /dev/null; then
    echo "      ufw allow 3000"
fi
if command -v firewall-cmd &> /dev/null; then
    echo "      firewall-cmd --add-port=3000/tcp --permanent && firewall-cmd --reload"
fi
echo ""
echo "   常用命令："
echo "      pm2 logs shareyee    查看日志"
echo "      pm2 restart shareyee 重启应用"
echo "      pm2 stop shareyee    停止应用"

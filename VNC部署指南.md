# VNC 一键部署指南

> 适用于无法使用 SSH，只能通过供应商 VNC 连接的场景

---

## 前置要求

- VPS 已安装 **Node.js 18+** 和 **PostgreSQL**
- VNC 桌面环境可打开浏览器和终端

---

## 部署步骤（共 4 步）

### 1. 上传项目到 VPS

在 VNC 桌面中：

- **方法A**：打开浏览器，访问 GitHub/GitLab，下载项目 zip 到桌面，解压到 `~/shareyee`
- **方法B**：如果你有本地文件，通过 VNC 的文件传输功能上传到 `~/shareyee`

确保最终目录结构如下：

```
~/shareyee/
  ├── server.js
  ├── package.json
  ├── prisma/
  ├── deploy.sh
  └── ...
```

---

### 2. 配置环境变量

在 VNC 终端中执行：

```bash
cd ~/shareyee
cp .env.example .env
```

用文本编辑器（如 `nano` 或 VNC 自带的编辑器）打开 `.env`，填写以下关键配置：

| 配置项 | 说明 | 示例 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接地址 | `postgresql://user:pass@localhost:5432/shareyee?schema=public` |
| `MAIL_USER` | QQ 邮箱地址 | `123456@qq.com` |
| `MAIL_PASS` | QQ SMTP 授权码 | `abcdefghijklmnop` |
| `MORALIS_API_KEY` | Moralis API 密钥 | `eyJhbGciOiJIUzI1NiIs...` |
| `WEB3_WALLET_ADDRESS` | 钱包地址（可选） | `0x5920...` |

保存并关闭。

---

### 3. 一键部署

在 VNC 终端中执行：

```bash
cd ~/shareyee
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- 检查 Node.js / npm / PM2
- 安装依赖
- 运行 Prisma 迁移
- 启动应用（后台运行）

---

### 4. 验证部署

```bash
pm2 status
pm2 logs shareyee --lines 20
```

看到 `online` 状态即表示启动成功。

用浏览器访问：
- 本机测试：`http://localhost:3000`
- 公网访问：`http://你的VPS_IP:3000`（需确保防火墙放行 3000 端口）

---

## 常用命令

```bash
# 查看日志
pm2 logs shareyee

# 重启
pm2 restart shareyee

# 停止
pm2 stop shareyee

# 开机自启（可选，需要 root）
pm2 startup
sudo env PATH=$PATH:$(dirname $(which node)) pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

---

## 如果报错

| 问题 | 解决方式 |
|---|---|
| `DATABASE_URL` 连接失败 | 检查 PostgreSQL 是否启动、用户名密码是否正确 |
| `pm2: command not found` | 脚本会自动安装，如失败请手动运行 `npm install -g pm2` |
| 端口 3000 被占用 | 修改 `.env` 中的 `PORT` 变量，或 `lsof -i :3000` 查找占用进程 |
| Prisma 迁移失败 | 检查数据库权限，或运行 `npx prisma migrate status` 查看详情 |

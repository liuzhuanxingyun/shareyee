# shareyee

个人作品集网站，包含个人介绍和投资看板两大板块，支持实时拉取价格、汇率与新闻。

## 1. 个人介绍板块

- 姓名: 曾展鹏
- 英文名: David Zeng
- 学校: GDUT 大三在读
- 工作邮箱: 3559595350@qq.com
- 语言: 粤语、普通话（母语）、英语 CET-4
- 经验:
	- 区块链量化交易，策略运行超过 5 个月
	- 微信小程序开发
	- 苹果 App 上架经历

## 2. 投资看板板块

主要在美股开盘后和收盘后观察持仓表现。

### 持仓数据

- UBERON: 持有 1.83047，成本 150 USD
- TQQQON: 持有 0.47427，成本 25 USD
- COINON: 持有 0.28838，成本 50 USD
- BABAON: 持有 0.36844，成本 50 USD

- 总投入: 275 USD
- 参考说明: 约 2134.5 RMB，另有 25 USD 闲置

### 看板任务

1. 计算每个资产平均成本价（USD）
2. 联网获取最新价格（近似使用对应股票价格）
3. 计算每个持仓的盈亏金额（USD）和盈亏比例（%）
4. 计算持仓总盈亏金额、总盈亏比例
5. 获取 USD/CNY 汇率并将总盈亏折合 RMB
6. 展示 3 条当下世界影响力较高的新闻

## 本地运行

### 环境要求

- Node.js 18+（建议 Node.js 20+）
- npm

### 启动步骤

```bash
npm install
npm start
```

启动后访问:

- 页面: `http://localhost:3000`
- 股票接口: `http://localhost:3000/api/stocks`
- 汇率接口: `http://localhost:3000/api/forex`
- 新闻接口: `http://localhost:3000/api/news`

## 本地测试（推荐）

在另一个终端执行:

```bash
curl -s http://localhost:3000/api/stocks
curl -s http://localhost:3000/api/forex
curl -s http://localhost:3000/api/news
```

说明:

- `stocks` 和 `forex` 通常可直接返回。
- `news` 依赖境外 RSS 源，若本地网络受限可能返回慢或不可用；部署到美国 VPS 后通常更稳定。

如果需要更清晰输出（macOS 自带 python3）:

```bash
curl -s http://localhost:3000/api/stocks | python3 -m json.tool
```

## 部署到美国 VPS（简版）

```bash
npm install
PORT=3000 npm start
```

建议使用 `pm2` 或 `systemd` 守护进程，并用 Nginx 做反向代理。

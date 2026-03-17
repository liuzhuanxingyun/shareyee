# shareyee

[![Live Site](https://img.shields.io/badge/Live-shareyee.duckdns.org-2ea44f?style=flat-square)](http://shareyee.duckdns.org)

在线访问: [http://shareyee.duckdns.org](http://shareyee.duckdns.org)

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

### 看板任务

1. 计算每个资产平均成本价（USD）
2. 联网获取最新价格（近似使用对应股票价格）
3. 计算每个持仓的盈亏金额（USD）和盈亏比例（%）
4. 计算持仓总盈亏金额、总盈亏比例
5. 获取 USD/CNY 汇率并将总盈亏折合 RMB
6. 展示 3 条当下世界影响力较高的新闻
7. 每天早上七点半发送持仓盈亏给对应邮箱
8. 在这里增加一个环形显示，显示不同股票的占比

## 3.兴趣板块

1. 我曾经用logic pro弄过一首简单的歌（我将上传一首歌）
2. 旅行，整一个旅游的地图，高亮到访省份：北京、广东、香港、海南、广西。

## 本地运行

### 环境要求

- Node.js 18+（建议 Node.js 20+）
- npm

### 启动步骤

```bash
npm install
npm start
```

## 持仓数据安全存储（方案A）

项目已改为由后端统一读取私有持仓文件，前端不再硬编码持仓数据。

### 文件说明

- `data/portfolio.private.json`: 私有持仓文件（已在 `.gitignore` 忽略，不会提交）
- `data/portfolio.example.json`: 持仓模板文件（可提交，用于参考）

### 修改持仓份数

1. 编辑 `data/portfolio.private.json`
2. 按以下格式维护每个持仓项：

```json
[
	{
		"label": "UBERON",
		"ticker": "UBER",
		"shares": 1.83047,
		"cost": 150
	}
]
```

字段要求：

- `label`: 非空字符串
- `ticker`: 大写股票代码（允许 `.`）
- `shares`: 大于 0
- `cost`: 大于等于 0

### 生效方式

- 看板刷新时会重新读取文件，修改后刷新页面即可看到最新份数
- 邮件日报发送时也读取同一文件，保证数据源一致

### 可选配置

可在 `.env` 中设置持仓文件路径（默认 `./data/portfolio.private.json`）：

```dotenv
PORTFOLIO_FILE=./data/portfolio.private.json
```
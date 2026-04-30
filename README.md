# AlgoLink

AlgoLink 是一个面向算法竞赛学习者的 AI 多 OJ 刷题数据分析平台。项目聚合 Codeforces、洛谷、AtCoder 等平台的公开刷题数据，用于展示刷题趋势、提交记录、能力画像、训练计划、每日一题和排行榜。

当前版本使用简易用户名制和本地 SQLite 后端保存数据。它不是 Online Judge，不提供代码评测能力，也不要求用户输入任何 OJ 密码。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- ECharts
- Axios
- Express.js + TypeScript
- SQLite + better-sqlite3

## 本地启动

安装依赖：

```sh
npm install
```

同时启动前端和后端：

```sh
npm run dev
```

单独启动前端：

```sh
npm run dev:client
```

单独启动后端：

```sh
npm run dev:server
```

构建前端：

```sh
npm run build
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

## 项目结构

```text
src/
  components/     前端组件
  mock/           前端 mock 数据
  router/         Vue Router 路由
  services/       前端 API Client 与 OJ 数据服务
  stores/         Pinia 主 Store
  types/          TypeScript 类型定义
  utils/          分析、缓存等工具函数
  views/          页面视图

server/
  src/
    db.ts         SQLite 初始化与数据库连接
    index.ts      Express 应用入口
    routes/       后端 API 路由
  data/
    app.db        本地 SQLite 数据库文件，运行时自动创建
```

## 数据存储策略

SQLite 是当前真实数据源。后端使用 `server/data/app.db` 保存用户、账号绑定、提交记录、用户状态和排行榜。

localStorage 是前端缓存，用于：

- 后端关闭或请求失败时继续显示已有数据
- 页面刷新时先展示本地缓存，再等待服务器数据覆盖
- 未登录用户继续使用原有本地体验

用户相关缓存都会带上 `userId`，格式为：

```text
algolink:${userId}:accounts
algolink:${userId}:submissions
algolink:${userId}:settings
algolink:${userId}:trainingPlan
algolink:${userId}:dailyChallenge
```

以下 key 是全局 key：

```text
algolink:currentUserId
algolink:currentUsername
algolink.leaderboard
algolink.theme
```

## 用户区分方案

当前使用简易用户名制：

- 用户在前端输入 `username`
- 前端调用 `POST /api/user`
- 后端使用 `username` 作为 `userId`
- 不同用户的数据通过 `userId` 隔离

这不是正式权限系统。当前没有实现密码、JWT、角色权限或会话管理。

## API 列表

### 健康检查

```http
GET /api/health
```

返回：

```json
{ "ok": true }
```

### 用户

```http
POST /api/user
Content-Type: application/json

{ "username": "Aarter" }
```

返回：

```json
{ "userId": "Aarter", "username": "Aarter" }
```

```http
GET /api/user/:userId
```

返回用户全量数据：

```json
{
  "userId": "Aarter",
  "accounts": [],
  "submissions": {
    "Codeforces": [],
    "Luogu": [],
    "AtCoder": []
  },
  "settings": null,
  "trainingPlan": null,
  "dailyChallenge": null
}
```

### OJ 账号绑定

```http
PUT /api/user/:userId/accounts
Content-Type: application/json

{ "accounts": [] }
```

### 提交记录

```http
PUT /api/user/:userId/submissions
Content-Type: application/json

{
  "submissions": {
    "Codeforces": [],
    "Luogu": [],
    "AtCoder": []
  }
}
```

### 用户状态

```http
PUT /api/user/:userId/settings
Content-Type: application/json

{ "settings": {} }
```

```http
PUT /api/user/:userId/training-plan
Content-Type: application/json

{ "trainingPlan": {} }
```

```http
PUT /api/user/:userId/daily
Content-Type: application/json

{ "dailyChallenge": {} }
```

### 排行榜

排行榜是全局共享数据，不按 `userId` 隔离。

```http
GET /api/leaderboard
```

返回：

```json
{
  "items": [
    { "username": "Aarter", "score": 100 }
  ]
}
```

```http
POST /api/leaderboard
Content-Type: application/json

{ "username": "Aarter", "score": 100 }
```

## 错误格式

后端错误响应统一为：

```json
{ "error": "message" }
```

前端 API Client 会将错误转换成友好提示。服务器不可用时，页面保留 localStorage 缓存，不应白屏。

## 后续可升级方向

- 使用 JWT 登录替代简易用户名制
- 增加正式权限系统和用户会话
- 将 SQLite 升级为 PostgreSQL 或 MySQL
- 将后端部署到云服务器
- 增加数据备份和迁移脚本
- 将 AI 建议接入真实 AI API


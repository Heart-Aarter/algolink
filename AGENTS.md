# AlgoLink 开发约束

本项目是网页设计比赛作品，主题为“AI 多 OJ 刷题数据分析平台”。

AlgoLink 面向算法竞赛学习者，支持聚合 Codeforces、洛谷、AtCoder 等平台的公开刷题数据，并生成刷题趋势、能力画像、训练建议和 AI 分析结果。

## 项目定位

- 不实现真正的 Online Judge。
- 不实现代码评测系统。
- 不要求用户输入其他 OJ 的密码，只允许绑定公开用户名 / handle。
- 整体风格偏科技感、数据平台、算法训练工具。
- 可以使用 mock 数据，但当前后端 SQLite 已作为主要持久化数据源。

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
- CSS

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

构建检查：

```sh
npm run build
```

默认端口：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

## 后端架构

后端位于 `server/` 目录，使用 Express.js + TypeScript。

核心文件：

- `server/src/index.ts`：Express 入口、请求日志、路由挂载、统一错误响应
- `server/src/db.ts`：SQLite 数据库初始化
- `server/src/routes/`：业务 API 路由
- `server/data/app.db`：本地 SQLite 数据库，运行时自动创建

数据库文件不提交到 Git。`server/data/.gitkeep` 用于保留目录。

## 数据存储策略

SQLite 是真实数据源：

- `users`
- `user_accounts`
- `user_submissions`
- `user_state`
- `leaderboard`

localStorage 是前端缓存：

- 后端关闭时保留可用界面
- 页面刷新时先显示本地缓存
- 服务器成功返回后再覆盖 Store

用户相关缓存必须包含 `userId`：

```text
algolink:${userId}:accounts
algolink:${userId}:submissions
algolink:${userId}:settings
algolink:${userId}:trainingPlan
algolink:${userId}:dailyChallenge
```

允许继续使用全局 key 的数据：

- `algolink:currentUserId`
- `algolink:currentUsername`
- `algolink.theme`
- `algolink.leaderboard`

## 用户区分方案

当前是简易用户名制：

- 前端输入 `username`
- 调用 `POST /api/user`
- 后端使用 `username` 作为 `userId`
- 账号、提交、设置、训练计划、每日一题通过 `userId` 隔离

这不是正式认证系统。不要把它描述成已经实现 JWT、密码登录、权限系统或安全会话。

## API 列表

- `GET /api/health`
- `POST /api/user`
- `GET /api/user/:userId`
- `PUT /api/user/:userId/accounts`
- `PUT /api/user/:userId/submissions`
- `PUT /api/user/:userId/settings`
- `PUT /api/user/:userId/training-plan`
- `PUT /api/user/:userId/daily`
- `GET /api/leaderboard`
- `POST /api/leaderboard`

后端错误响应统一为：

```json
{ "error": "message" }
```

## 前端约定

- 所有表单控件优先使用 Naive UI，例如 `n-select`、`n-checkbox`、`n-input`。
- 禁止新增裸 `<select>` / `<input type="checkbox">` 等原生表单控件。
- 新增页面优先复用 `StatCard`、`ChartPanel`、`.panel`、`.policy-card` 等现有组件和样式类。
- `route.meta.title` 用于页面 `<h1>` 标题和浏览器 tab 标题同步。
- 数据展示优先使用 Store computed，不直接在模板中写复杂逻辑。
- Mock 数据写在 `src/mock/`，类型定义写在 `src/types/algolink.ts`。

## 修改要求

- 每次修改后必须保证 `npm run build` 通过。
- 涉及前后端联调时，需要确认 `npm run dev` 能启动前端和后端。
- 删除文件前先搜索确认没有引用。
- 不要提交 `server/data/*.db`。

## 后续可升级方向

- JWT 登录
- 正式权限系统
- PostgreSQL / MySQL
- 云服务器部署
- 数据备份和迁移脚本


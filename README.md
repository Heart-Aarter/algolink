# AlgoLink

AlgoLink 是一个面向算法竞赛学习者的 **AI 多 OJ 刷题数据分析平台**。项目聚合 Codeforces、洛谷和AtCoder 平台的公开刷题数据，用于展示刷题趋势、提交记录、个人资料、能力画像、训练建议、训练报告、训练计划、每日一题和排行榜。

本项目是网页设计比赛作品，定位是“数据分析平台”和“算法训练工具”，不是 Online Judge：

- 不实现代码评测系统。
- 不要求用户输入其他 OJ 的密码、cookie 或私有 token。
- 只允许绑定公开 username / handle。
- 后端 SQLite 作为持久化数据源。

## 页面功能

| 页面 | 路由 | 说明 |
|---|---|---|
| 登录 | `/login` | 输入用户名和 6-64 位密码进入系统；后端校验密码并创建服务端会话。 |
| Dashboard | `/` | 训练热力图、提交趋势、标签/难度分布、推荐训练入口。 |
| OJ 账号绑定 | `/accounts` | 绑定 Codeforces / Luogu / AtCoder 公开 handle，同步公开数据。 |
| 提交记录 | `/submissions` | 按平台、结果、语言、标签、难度等维度筛选，支持分页和统计卡片。 |
| 个人资料 | `/profile` | 展示当前用户、绑定账号、训练概览和公开资料信息。 |
| 能力画像 | `/ability-profile` | 标签、难度、结果、语言分布图表和标签通过率分析。 |
| AI 训练建议 | `/ai-advice` | 默认使用本地规则兜底；配置 OpenAI Compatible 或 DeepSeek 接口后可生成真实 AI 分析。 |
| 训练报告 | `/training-report` | 基于提交数据生成阶段诊断、短板分析和方向建议。 |
| 训练计划 | `/training-plan` | 7 天训练路线图，每日状态可切换并持久化。 |
| 每日一题 | `/daily` | 提供 Easy / Medium / Hard 三档题目，验证 OJ AC 后写入完成状态和排行榜积分。 |
| 排行榜 | `/leaderboard` | 支持总榜、今日榜、本周榜、连续打卡榜，展示前三名、当前用户和分差。 |
| 设置 | `/settings` | 同步频率、AI 语气、默认平台、公开数据开关、AI 接入配置和本地数据重置。 |
| 关于 | `/about` | 项目介绍、功能卡片、技术栈展示和设计原则。 |
| 404 | `/*` | 未匹配路由提示页面。 |

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Naive UI
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

构建检查：

```sh
npm run build
```

`npm run build` 会同时执行：

- `vue-tsc --build`
- `npm --workspace server run build`
- `vite build`

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

洛谷同步统一通过后端公开代理 `/api/luogu/...` 访问洛谷公开接口，后端会补齐洛谷接口需要的浏览器请求头并阻止同地址 `302` 重定向循环。项目不要求、也不会保存洛谷 cookie、密码或私有 token；题目标签接口只作为增强数据，失败时同步仍会保留公开练习记录。

## 环境变量

前端 API 地址可以通过 `VITE_API_BASE` 覆盖。后端加密保存 AI API Key 时必须配置 `ALGOLINK_ENCRYPTION_SECRET`。

本地开发默认走 Vite `/api` 代理。建议复制 `.env.example` 为 `.env`，至少配置后端加密密钥；如果要绕过代理直连后端，也可以在同一个 `.env` 中设置 `VITE_API_BASE`：

```env
VITE_API_BASE=http://localhost:3001
ALGOLINK_ENCRYPTION_SECRET=replace-with-a-long-random-secret
```

生产环境默认走同源 `/api`，通常不需要配置 `VITE_API_BASE`。如果前端和后端分开部署，可以显式设置完整后端地址：

```env
VITE_API_BASE=https://your-api-domain.example
ALGOLINK_ENCRYPTION_SECRET=replace-with-a-long-random-secret
```

AI 分析接口不通过环境变量固定配置。用户可在设置页选择 OpenAI Compatible 或 DeepSeek，并填写 API Base URL、API Key 和模型名；DeepSeek 默认使用 `https://api.deepseek.com` 和 `deepseek-v4-flash`。API Key 使用 `ALGOLINK_ENCRYPTION_SECRET` 在后端加密保存，换设备登录后可继续使用；页面不会回显完整 Key，真实 AI 请求由后端解密后代理转发。

兼容说明：DeepSeek 使用 OpenAI-compatible Chat Completions 协议。前端会把 DeepSeek 请求按兼容协议提交给后端，并使用 DeepSeek 的 Base URL 和模型名，因此旧版后端只要支持 OpenAI Compatible 转发，也能转发 DeepSeek 请求。

## 项目结构

```text
src/
  assets/         全局样式（base.css, main.css）
  components/
    charts/       图表面板组件（ChartPanel）
    common/       通用组件（StatCard）
    layout/       桌面端和移动端布局组件
  composables/    组合式函数（useTheme, useMockAsync）
  mock/           mock 数据、推荐题目和训练计划数据
  router/         Vue Router 路由配置、登录守卫和标题同步
  services/       API Client、Codeforces / Luogu / AtCoder 数据同步服务
  stores/         Pinia Store，含 localStorage 缓存与服务器持久化
  types/          TypeScript 类型定义
  utils/          数据分析、标签、日期、提交过滤、判题结果和存储工具函数
  views/          页面视图

server/
  src/
    db.ts         SQLite 初始化、建表和兼容迁移
    env.ts        后端 .env 读取工具
    index.ts      Express 入口、请求日志、CORS、JSON 请求体限制、路由挂载和错误处理
    middleware.ts 用户会话鉴权和 userId 权限校验中间件
    secrets.ts    AI API Key 加密和解密工具
    routes/       user, accounts, ai, submissions, settings, trainingPlan, daily, leaderboard, luogu
  data/
    .gitkeep      保留数据目录
    app.db        SQLite 数据库，运行时自动生成，不提交到 Git
  dist/           后端生产构建输出，不提交到 Git
```

## 数据存储策略

SQLite 是主要持久化数据源，数据库文件运行时自动创建：

```text
server/data/app.db
```

数据库包含：

- `users`：用户 id、密码 hash 和 salt。
- `user_sessions`：登录会话 token hash、所属用户和过期时间。
- `user_accounts`：按用户保存 OJ 账号绑定数据。
- `user_submissions`：按用户和平台保存提交记录。
- `user_state`：按用户保存设置、训练计划和每日一题状态。
- `user_secrets`：按用户保存加密后的 AI API Key 密文、IV 和认证标签。
- `leaderboard`：全局累计积分。
- `leaderboard_events`：排行榜积分事件，用于今日榜、本周榜、连续打卡榜和去重。

`localStorage` 是前端缓存：

- 后端关闭时保留可用界面。
- 页面刷新时先显示本地缓存。
- 服务器成功返回后再覆盖 Store。
- AI API Key 不保存在 localStorage；后端使用 `ALGOLINK_ENCRYPTION_SECRET` 加密后写入 SQLite。

用户相关缓存必须包含 `userId`：

```text
algolink:${userId}:accounts
algolink:${userId}:submissions
algolink:${userId}:settings
algolink:${userId}:trainingPlan
algolink:${userId}:dailyChallenge
```

允许继续使用全局 key：

```text
algolink:currentUserId
algolink:currentUsername
algolink:sessionToken
algolink:sessionExpiresAt
algolink.theme
algolink.leaderboard
algolink.cfAvatars
```

不提交数据库文件。`.gitignore` 已忽略：

```text
server/data/*.db
server/data/*.db-*
```

## 用户和会话方案

当前是项目内置的用户名 + 密码 + 服务端会话方案：

1. 前端输入 `username` 和 6-64 位 `password`。
2. 前端调用 `POST /api/user`。
3. 后端使用 `username` 作为 `userId`。
4. 首次使用某个用户名时，后端保存 PBKDF2 密码 hash 和 salt；之后使用同一用户名需要密码校验。
5. 登录成功后后端创建会话，前端保存 `sessionToken` 和过期时间。
6. 账号、提交、设置、训练计划、每日一题等私有接口必须携带 `Authorization: Bearer <sessionToken>`，且 token 所属用户必须与 URL 中的 `userId` 一致。
7. 当前没有接入 OAuth、短信验证、邮箱验证或第三方身份服务。

## API 列表

### 健康检查

```http
GET /api/health
```

响应：

```json
{ "ok": true }
```

### 用户

```http
POST /api/user
Content-Type: application/json

{ "username": "Aarter", "password": "password123" }
```

响应：

```json
{
  "userId": "Aarter",
  "username": "Aarter",
  "sessionToken": "server-session-token",
  "sessionExpiresAt": "2026-06-26T12:00:00.000Z"
}
```

```http
GET /api/user/:userId
Authorization: Bearer <sessionToken>
```

响应示例：

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
  "hasAiApiKey": false,
  "trainingPlan": null,
  "dailyChallenge": null
}
```

### OJ 账号和提交数据

```http
PUT /api/user/:userId/accounts
Authorization: Bearer <sessionToken>
Content-Type: application/json

{ "accounts": [] }
```

```http
PUT /api/user/:userId/submissions
Authorization: Bearer <sessionToken>
Content-Type: application/json

{
  "submissions": {
    "Codeforces": [],
    "Luogu": [],
    "AtCoder": []
  }
}
```

洛谷公开数据由后端代理转发，前端同步会调用以下白名单接口，不收集洛谷 cookie、密码或私有 token：

```http
GET /api/luogu/api/user/search?keyword=Aarter
GET /api/luogu/user/:uid/practice
GET /api/luogu/problem/list?keyword=P1001
GET /api/luogu/_lfe/tags
```

其中 `/problem/list` 和 `/_lfe/tags` 只用于补全题目标签；这些增强请求失败时，账号资料、AC 数和公开练习记录仍会正常保存。

### 用户状态

```http
PUT /api/user/:userId/settings
Authorization: Bearer <sessionToken>
Content-Type: application/json

{ "settings": {} }
```

`settings.aiApiKey` 非空时表示新增或替换 API Key；后端会使用 `ALGOLINK_ENCRYPTION_SECRET` 加密保存，并只返回 `hasAiApiKey` 状态，不返回明文 Key。

```http
DELETE /api/user/:userId/settings/ai-key
Authorization: Bearer <sessionToken>
```

```http
PUT /api/user/:userId/training-plan
Authorization: Bearer <sessionToken>
Content-Type: application/json

{ "trainingPlan": {} }
```

```http
PUT /api/user/:userId/daily
Authorization: Bearer <sessionToken>
Content-Type: application/json

{ "dailyChallenge": {} }
```

### AI 分析

```http
POST /api/user/:userId/ai/advice
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

请求体包含用户设置、训练统计、弱项标签和近期提交样本。当前支持 OpenAI Compatible 和 DeepSeek 接口；DeepSeek 复用 OpenAI-compatible Chat Completions 协议。后端会从当前登录用户的加密密钥记录中解密 API Key，请求 `${API Base URL}/chat/completions`，并要求返回可解析 JSON。

未启用或未完整配置 AI 接口时，前端使用本地规则建议作为兜底。

### 排行榜

排行榜是全局数据，不按 `userId` 隔离。读取时可通过 `username` 标记当前用户，通过 `period` 切换榜单。

```http
GET /api/leaderboard?period=all&username=Aarter&limit=100&offset=0
```

`period` 可选：

- `all`：累计积分。
- `today`：今日积分。
- `week`：本周积分。
- `streak`：连续打卡天数。

响应：

```json
{
  "items": [
    { "username": "Aarter", "score": 100, "rank": 1, "isCurrentUser": true }
  ],
  "currentUser": {
    "username": "Aarter",
    "score": 100,
    "rank": 1,
    "isCurrentUser": true,
    "gapToPrevious": 0
  },
  "total": 1,
  "period": "all"
}
```

```http
POST /api/leaderboard
Authorization: Bearer <sessionToken>
Content-Type: application/json

{
  "username": "Aarter",
  "score": 30,
  "eventId": "daily:Aarter:2026-05-24:cf-1000A",
  "source": "daily-challenge",
  "date": "2026-05-24"
}
```

```http
GET /api/leaderboard/events?username=Aarter&limit=20
```

## 错误响应

后端错误响应统一为：

```json
{ "error": "message" }
```

前端 API Client 会把后端错误、超时、无法连接服务器等情况转换成用户可读提示，并保留本地缓存。


## Linux 服务器部署

推荐生产部署方式：

- 前端 `dist/` 作为静态文件。
- 后端 `server/dist/` 作为 Node 服务。
- Nginx 对外提供静态文件和 `/api` 反向代理。
- SQLite 数据库保存在 `server/data/app.db`。

### 构建

```sh
npm install
npm run build
```

`npm run build` 只负责构建前端 `dist/` 和后端 `server/dist/`，不会启动生产服务。构建完成后需要启动后端：

```sh
npm --workspace server run start
```

生产环境前端默认请求当前域名下的 `/api/...`，因此同域部署时通常不需要 `.env.production`。如果前端和 API 不在同一个域名，再通过 `VITE_API_BASE` 指向完整 API 地址并重新构建。

### systemd 后端服务示例

`/etc/systemd/system/algolink.service`：

```ini
[Unit]
Description=AlgoLink API Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/algolink/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动：

```sh
sudo systemctl daemon-reload
sudo systemctl enable algolink
sudo systemctl start algolink
sudo systemctl status algolink
```

### Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/algolink/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用后检查：

```sh
sudo nginx -t
sudo systemctl reload nginx
curl http://localhost:3001/api/health
```


## 后续可升级方向

- JWT 登录与正式权限系统。
- 更细粒度的 AI 模型配置和提示词模板。
- PostgreSQL / MySQL 替代 SQLite。
- 云服务器部署和 HTTPS。
- 数据备份和迁移脚本。
- 单元测试和 E2E 测试。
- CI/CD 自动化部署。

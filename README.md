# AlgoLink

AlgoLink 是一个面向算法竞赛学习者的 **AI 多 OJ 刷题数据分析平台**。项目聚合 Codeforces、洛谷、AtCoder 等平台的公开刷题数据，用于展示刷题趋势、提交记录、能力画像、训练建议、训练计划、每日一题和排行榜。

本项目是网页设计比赛作品，定位是“数据分析平台”和“算法训练工具”，不是 Online Judge：

- 不实现代码评测系统。
- 不要求用户输入其他 OJ 的密码。
- 只允许绑定公开 username / handle。
- 可使用 mock 数据兜底展示，但后端 SQLite 已作为主要持久化数据源。

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

`npm run build` 会同时检查前端和后端：

- `vue-tsc --build`
- `vite build`
- `npm --workspace server run build`

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

## 环境变量

前端 API 地址通过 `VITE_API_BASE` 配置。

本地开发默认值：

```env
VITE_API_BASE=http://localhost:3001
```

如果前端和后端同域部署，生产环境可以使用：

```env
VITE_API_BASE=/api
```

## 项目结构

```text
src/
  components/     通用组件与布局组件
  mock/           mock 数据和推荐题目数据
  router/         Vue Router 路由
  services/       API Client 和 OJ 数据同步服务
  stores/         Pinia Store
  types/          TypeScript 类型定义
  utils/          数据分析、过滤、存储等工具函数
  views/          页面视图

server/
  src/
    db.ts         SQLite 初始化
    index.ts      Express 入口
    routes/       后端 API 路由
  data/
    .gitkeep      保留数据目录
    app.db        运行时自动生成，不提交到 Git
```

## 数据存储策略

SQLite 是主要持久化数据源，数据库文件运行时自动创建：

```text
server/data/app.db
```

数据库包含：

- `users`
- `user_accounts`
- `user_submissions`
- `user_state`
- `leaderboard`

`localStorage` 是前端缓存：

- 后端关闭时保留可用界面。
- 页面刷新时先显示本地缓存。
- 服务器成功返回后再覆盖 Store。

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
algolink.theme
algolink.leaderboard
```

不要提交数据库文件。`.gitignore` 已忽略：

```text
server/data/*.db
server/data/*.db-*
```

## 用户方案

当前是简易用户名制，不是正式认证系统：

1. 前端输入 `username`。
2. 前端调用 `POST /api/user`。
3. 后端使用 `username` 作为 `userId`。
4. 账号、提交、设置、训练计划、每日一题通过 `userId` 隔离。

不要把当前实现描述成已经支持 JWT、密码登录、权限系统或安全会话。

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

{ "username": "Aarter" }
```

响应：

```json
{ "userId": "Aarter", "username": "Aarter" }
```

```http
GET /api/user/:userId
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
  "trainingPlan": null,
  "dailyChallenge": null
}
```

### OJ 账号

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

排行榜是全局数据，不按 `userId` 隔离。

```http
GET /api/leaderboard
```

响应：

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

## 错误响应

后端错误响应统一为：

```json
{ "error": "message" }
```

前端 API Client 会把后端错误、超时、无法连接服务器等情况转换成用户可读提示，并保留本地缓存。

## 临时把电脑当服务器

比赛展示或局域网演示时，可以临时把自己的电脑当服务器。

启动：

```sh
npm run dev -- --host 0.0.0.0
```

查看本机局域网 IP：

```powershell
ipconfig
```

假设 IPv4 地址是 `192.168.1.23`，同一 Wi-Fi / 局域网中的其他设备访问：

```text
http://192.168.1.23:5173
```

同时需要让前端请求这台电脑上的后端。创建 `.env.local`：

```env
VITE_API_BASE=http://192.168.1.23:3001
```

然后重启开发服务。Windows 防火墙需要允许 Node.js，或放行 `5173` 和 `3001` 端口。

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

如果前后端同域部署，建议创建 `.env.production`：

```env
VITE_API_BASE=/api
```

然后重新构建：

```sh
npm run build
```

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

## GitHub Pages 部署说明

GitHub Pages 只能托管静态前端，不能运行 Express 后端和 SQLite 数据库。

因此：

- 完整项目不适合只部署到 GitHub Pages。
- 如果只想展示 UI，可以把 GitHub Pages 当作“前端展示版”。
- 如果要完整运行，需要 GitHub Pages 前端 + 独立后端服务，或直接使用 Linux 服务器部署完整项目。

如果仓库名不是根域名，需要在 `vite.config.ts` 中配置 `base`：

```ts
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [vue(), vueDevTools()],
})
```

如果前端托管在 GitHub Pages，后端单独部署，需要配置：

```env
VITE_API_BASE=https://your-api-domain.com
```

## 后续可升级方向

- JWT 登录。
- 正式权限系统。
- PostgreSQL / MySQL。
- 云服务器部署和 HTTPS。
- 数据备份和迁移脚本。
- 接入真实 AI API 生成训练建议。

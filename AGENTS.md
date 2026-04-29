# AlgoLink 开发约束

本项目是网页设计比赛作品，主题为「AI 多 OJ 刷题数据分析平台」。

## 项目定位

AlgoLink 面向算法竞赛学习者，支持聚合 Codeforces、洛谷、AtCoder 等平台的公开刷题数据，并生成刷题趋势、能力画像、训练建议和 AI 分析结果。

## 重要规则

1. 可以使用 Vue、Vite、TypeScript、Vue Router、Pinia、ECharts、Axios 等开源框架和工具库。
2. 页面结构、业务模块、文案和数据展示逻辑必须围绕 AlgoLink 自主设计。
3. 可以使用少量后端技术。
4. 数据使用 mock 数据和 localStorage。
5. 不实现真正的 Online Judge，不实现代码评测系统。
6. 不要求用户输入其他 OJ 的密码，只允许绑定公开用户名 / handle。
7. 整体风格偏科技感、数据平台、算法训练工具。
8. 每次修改后必须保证 npm run dev 和 npm run build 可以正常运行。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- ECharts
- Axios
- 普通 CSS

## 第一阶段目标

搭建一个可运行的前端基础框架，包括：

- 顶部 Header
- 左侧 Sidebar
- 主内容区域
- 首页 Dashboard
- OJ 账号绑定页
- 提交记录页
- 能力画像页
- AI 训练建议页
- 训练计划页
- 设置页
- mock 数据文件
- 基础路由结构
- 基础组件结构

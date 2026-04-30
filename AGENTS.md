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

## 第一阶段目标 ✅

搭建一个可运行的前端基础框架，包括：

- [x] 顶部 Header
- [x] 左侧 Sidebar
- [x] 主内容区域
- [x] 首页 Dashboard
- [x] OJ 账号绑定页
- [x] 提交记录页
- [x] 能力画像页
- [x] AI 训练建议页
- [x] 训练计划页
- [x] 设置页
- [x] mock 数据文件
- [x] 基础路由结构
- [x] 基础组件结构

额外完成：
- [x] 训练报告页
- [x] 每日一题页
- [x] 排行榜页
- [x] 关于页

---

## 第二阶段目标

1. 补全 About 页面的项目介绍、功能亮点与技术栈展示
2. 增强排行榜页面：前三奖牌、排名序号、当前用户高亮、统计摘要
3. 统一全局表单控件为 Naive UI（NSelect / NCheckbox）
4. 清理 Vue 脚手架残留文件（HelloWorld / TheWelcome / WelcomeItem / counter / icons/*）

---

## 代码约定

- 所有表单控件统一使用 Naive UI（n-select / n-checkbox / n-input 等），禁止原生 `<select>` / `<input type="checkbox">` 等裸控件
- 新增页面优先复用 `StatCard`、`ChartPanel`、`.panel`、`.policy-card` 等现有组件和样式类
- route meta.title 用于页面 `<h1>` 标题和浏览器 tab 标题同步
- 删除文件前确认 `grep` 无其他引用；每次修改后必须保证 `npm run dev` 和 `npm run build` 通过
- 数据展示优先使用 store computed，不直接在模板中写复杂逻辑
- Mock 数据写在 `src/mock/` 目录，类型定义在 `src/types/algolink.ts`

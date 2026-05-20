<script setup lang="ts">
import { NTag } from 'naive-ui'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'

const store = useAlgoLinkStore()

const features = [
  {
    title: '多 OJ 数据聚合',
    icon: '01',
    text: '支持 Codeforces、洛谷、AtCoder 三大算法竞赛平台的公开数据绑定与同步，统一看板管理跨平台训练记录。',
  },
  {
    title: 'AI 规则化训练建议',
    icon: '02',
    text: '基于提交记录统计的规则引擎，自动识别薄弱标签、生成复盘建议和下一阶段专项训练计划。',
  },
  {
    title: '能力画像与趋势',
    icon: '03',
    text: 'ECharts 可视化展示标签分布、难度分布、提交趋势、提交热力图，直观反映算法掌握程度变化。',
  },
  {
    title: '训练报告生成',
    icon: '04',
    text: '基于 Codeforces 真实提交记录生成训练诊断书，涵盖近期状态、强弱项识别和进阶建议。',
  },
  {
    title: '训练计划管理',
    icon: '05',
    text: '7 天专项训练路线图，每日主题与题目推荐，进度状态持久化存储，刷新页面不丢失。',
  },
  {
    title: '每日一题挑战',
    icon: '06',
    text: '从 Codeforces 公开题库随机抽取 Easy + Hard 两道题，完成挑战计入排行榜积分。',
  },
]

const techStack = [
  { name: 'Vue 3', category: 'framework' },
  { name: 'Vite', category: 'tooling' },
  { name: 'TypeScript', category: 'language' },
  { name: 'Pinia', category: 'state' },
  { name: 'Vue Router', category: 'routing' },
  { name: 'Naive UI', category: 'ui' },
  { name: 'ECharts', category: 'chart' },
  { name: 'Axios', category: 'http' },
  { name: 'ESLint + Oxlint', category: 'lint' },
  { name: 'Prettier', category: 'format' },
]

type TechCategoryKey = 'framework' | 'language' | 'tooling' | 'state' | 'routing' | 'ui' | 'chart' | 'http' | 'lint' | 'format'

const techCategories: { key: TechCategoryKey; label: string }[] = [
  { key: 'framework', label: '框架' },
  { key: 'language', label: '语言' },
  { key: 'tooling', label: '构建' },
  { key: 'state', label: '状态' },
  { key: 'routing', label: '路由' },
  { key: 'ui', label: 'UI' },
  { key: 'chart', label: '图表' },
  { key: 'http', label: '网络' },
  { key: 'lint', label: '检查' },
  { key: 'format', label: '格式化' },
]

const categoryTypes: Record<TechCategoryKey, 'success' | 'info' | 'warning' | 'default'> = {
  framework: 'success' as const,
  language: 'info' as const,
  tooling: 'warning' as const,
  state: 'success' as const,
  routing: 'info' as const,
  ui: 'success' as const,
  chart: 'warning' as const,
  http: 'info' as const,
  lint: 'default' as const,
  format: 'default' as const,
}

const designPrinciples = [
  {
    title: '公开数据优先',
    text: '只绑定公开 username / handle，不收集密码、cookie 或私有 token，杜绝隐私风险。',
  },
  {
    title: '分层数据持久化',
    text: '后端 SQLite 作为主要持久化数据源，localStorage 仅作为前端缓存，后端不可用时仍可展示最近状态。',
  },
  {
    title: '科技感 UI',
    text: '深色主题搭配青蓝渐变、毛玻璃面板、ECharts 交互图表，营造数据平台和专业训练工具的氛围。',
  },
]
</script>

<template>
  <div class="page-stack about-page">
    <section class="hero-panel about-hero">
      <div>
        <p class="eyebrow">About AlgoLink</p>
        <h2>AI 多 OJ 刷题数据分析平台</h2>
        <p class="about-tagline">
          面向算法竞赛学习者的跨平台训练数据聚合与 AI 分析工具，帮助你在 Codeforces、洛谷、AtCoder
          之间建立统一的训练视图。
        </p>
        <div class="hero-actions">
          <RouterLink to="/">打开 Dashboard</RouterLink>
          <RouterLink class="secondary-link" to="/accounts">绑定 OJ 账号</RouterLink>
        </div>
      </div>
      <div class="about-hero-stats">
        <article>
          <strong>{{ store.supportedPlatforms.length }}</strong>
          <span>支持平台</span>
        </article>
        <article>
          <strong>{{ features.length }}</strong>
          <span>核心功能</span>
        </article>
        <article>
          <strong>{{ techStack.length }}</strong>
          <span>技术组件</span>
        </article>
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="数据来源" :value="techStack.filter(t => t.category === 'http').length" helper="公开 API + mock 兜底" />
      <StatCard label="可视化图表" :value="techStack.filter(t => t.category === 'chart').length" helper="ECharts 交互图表" />
      <StatCard label="路由页面" :value="10" helper="Dashboard 到 Settings 全覆盖" />
      <StatCard label="数据存储" value="SQLite" helper="绑定、提交与训练状态持久化" />
    </section>

    <section class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Features</p>
        <h2>核心功能</h2>
      </div>
      <div class="features-grid">
        <article v-for="item in features" :key="item.title" class="feature-card">
          <span class="feature-icon">{{ item.icon }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Tech Stack</p>
        <h2>技术栈</h2>
      </div>
      <div class="tech-grid">
        <article
          v-for="category in techCategories"
          :key="category.key"
          class="tech-category"
        >
          <strong class="tech-category-label">{{ category.label }}</strong>
          <div class="tech-tags">
            <n-tag
              v-for="tech in techStack.filter((t) => t.category === category.key)"
              :key="tech.name"
              :type="categoryTypes[category.key]"
              size="small"
              round
            >
              {{ tech.name }}
            </n-tag>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Design</p>
        <h2>设计原则</h2>
      </div>
      <div class="design-grid">
        <article v-for="item in designPrinciples" :key="item.title" class="design-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section class="panel about-footer">
      <p class="eyebrow">Acknowledgments</p>
      <h2>致谢</h2>
      <p>
        AlgoLink 使用 Codeforces 官方 API、AtCoder Problems API 和洛谷公开接口获取训练数据。
        感谢 Vue、Vite、Naive UI、ECharts 等开源项目的支持。本项目为网页设计比赛作品，不实现真实 OJ 评测系统。
      </p>
    </section>
  </div>
</template>

<style scoped>
.about-tagline {
  margin-top: 10px;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.7;
  max-width: 620px;
}

.about-hero-stats {
  display: flex;
  gap: 28px;
  margin-top: 20px;
}

.about-hero-stats article strong {
  display: block;
  color: var(--color-heading);
  font-size: 32px;
  font-weight: 850;
}

.about-hero-stats article span {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 10px;
}

.feature-card,
.design-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.feature-card h3,
.design-card h3 {
  margin-bottom: 8px;
  color: var(--color-heading);
  font-size: 15px;
  font-weight: 780;
}

.feature-card p,
.design-card p {
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.65;
}

.feature-card {
  padding: 22px 18px;
  background:
    linear-gradient(135deg, rgba(194, 138, 46, 0.06), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 48%), var(--color-surface);
}

.feature-icon {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 8px;
  background: rgba(140, 171, 159, 0.14);
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 800;
}

.tech-grid {
  display: grid;
  gap: 14px;
}

.tech-category {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.tech-category:last-child {
  border-bottom: none;
}

.tech-category-label {
  min-width: 72px;
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 720;
  text-transform: uppercase;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.design-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 10px;
}

.design-card {
  padding: 20px;
  background:
    linear-gradient(135deg, rgba(245, 211, 125, 0.045), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 48%), var(--color-surface);
}

.about-footer {
  padding: 28px;
}

.about-footer h2 {
  margin-bottom: 12px;
}

.about-footer p {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 820px) {
  .features-grid,
  .design-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .features-grid,
  .design-grid {
    grid-template-columns: 1fr;
  }

  .about-hero-stats {
    flex-direction: column;
    gap: 14px;
  }
}
</style>

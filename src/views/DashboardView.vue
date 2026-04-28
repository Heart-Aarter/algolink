<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import { mockAccounts, problemRecommendations } from '@/mock/algolink'
import { useAlgoLinkStore } from '@/stores/algolink'
import { calculateSubmissionAnalysis, parseSubmittedAt } from '@/utils/analysis'

const store = useAlgoLinkStore()

const codeforcesAccount = computed(() =>
  store.accounts.find((account) => account.platform === 'Codeforces'),
)
const fallbackCodeforcesAccount = computed(() =>
  mockAccounts.find((account) => account.platform === 'Codeforces'),
)
const dashboardAccount = computed(() => codeforcesAccount.value ?? fallbackCodeforcesAccount.value)
const dashboardSubmissions = computed(() =>
  store.codeforcesSubmissions.length ? store.codeforcesSubmissions : store.submissions,
)
const analysis = computed(() => calculateSubmissionAnalysis(dashboardSubmissions.value))
const dataSourceLabel = computed(() =>
  store.codeforcesSubmissions.length ? '真实 Codeforces 数据' : 'mock 兜底数据',
)

const chartAxis = '#738195'
const chartGrid = 'rgba(154, 170, 190, 0.1)'
const dayMs = 24 * 60 * 60 * 1000
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const heatmapWeekdayLabels = [
  { label: 'Mon', row: 2 },
  { label: 'Wed', row: 4 },
  { label: 'Fri', row: 6 },
]

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function getHeatmapLevel(count: number) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const heatmapDays = computed(() => {
  const today = startOfLocalDay(new Date())
  const start = new Date(today.getTime() - 364 * dayMs)
  start.setDate(start.getDate() - start.getDay())

  const counts = new Map<string, number>()

  for (const submission of dashboardSubmissions.value) {
    const submittedAt = parseSubmittedAt(submission.submittedAt)

    if (!submittedAt) {
      continue
    }

    const day = startOfLocalDay(submittedAt)

    if (day < start || day > today) {
      continue
    }

    const key = formatDateKey(day)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const days = []

  for (let time = start.getTime(); time <= today.getTime(); time += dayMs) {
    const date = new Date(time)
    const key = formatDateKey(date)
    const count = counts.get(key) ?? 0

    days.push({
      key,
      date,
      dateLabel: key,
      count,
      level: getHeatmapLevel(count),
    })
  }

  return days
})

const heatmapMonthLabels = computed(() => {
  const labels: { name: string; column: number; span: number }[] = []
  let currentMonth = ''

  heatmapDays.value.forEach((day, index) => {
    const month = `${day.date.getFullYear()}-${day.date.getMonth()}`

    if (month === currentMonth) {
      return
    }

    currentMonth = month
    labels.push({
      name: monthNames[day.date.getMonth()] ?? '',
      column: Math.floor(index / 7) + 1,
      span: 4,
    })
  })

  return labels
})

const heatmapSummary = computed(() => {
  const activeDays = heatmapDays.value.filter((day) => day.count > 0).length
  const total = heatmapDays.value.reduce((sum, day) => sum + day.count, 0)

  return { activeDays, total }
})

const dailyStats = computed(() => {
  const stats = new Map<string, { ac: number; attempts: number }>()

  for (const submission of dashboardSubmissions.value) {
    const date = parseSubmittedAt(submission.submittedAt)
    const key = date
      ? `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : submission.submittedAt.slice(5, 10)
    const current = stats.get(key) ?? { ac: 0, attempts: 0 }
    current.attempts += 1
    current.ac += submission.status === 'Accepted' ? 1 : 0
    stats.set(key, current)
  }

  return [...stats.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-14)
    .map(([date, value]) => ({ date, ...value }))
})

const trendOption = computed<EChartsOption>(() => ({
  color: ['#7fa4d8', '#66d6cb'],
  grid: { top: 36, right: 18, bottom: 34, left: 38 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#151d29',
    borderColor: 'rgba(154, 170, 190, 0.18)',
    textStyle: { color: '#dce5ef' },
  },
  xAxis: {
    type: 'category',
    data: dailyStats.value.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(154, 170, 190, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartAxis },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: chartGrid } },
    axisLabel: { color: chartAxis },
  },
  series: [
    {
      name: 'AC',
      type: 'bar',
      barMaxWidth: 16,
      data: dailyStats.value.map((item) => item.ac),
      itemStyle: { borderRadius: [5, 5, 0, 0], opacity: 0.82 },
    },
    {
      name: 'Submissions',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: { width: 2 },
      data: dailyStats.value.map((item) => item.attempts),
    },
  ],
}))

const tagOption = computed<EChartsOption>(() => {
  const items = analysis.value.tagDistribution.slice(0, 8).reverse()

  return {
    color: ['#8db1c7'],
    grid: { top: 36, right: 18, bottom: 34, left: 96 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#151d29',
      borderColor: 'rgba(154, 170, 190, 0.18)',
      textStyle: { color: '#dce5ef' },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: chartGrid } },
      axisLabel: { color: chartAxis },
    },
    yAxis: {
      type: 'category',
      data: items.map((item) => item.name),
      axisLine: { lineStyle: { color: 'rgba(154, 170, 190, 0.18)' } },
      axisTick: { show: false },
      axisLabel: { color: '#aab6c5' },
    },
    series: [
      {
        name: 'Submissions',
        type: 'bar',
        barMaxWidth: 14,
        data: items.map((item) => item.value),
        itemStyle: { borderRadius: [0, 5, 5, 0], opacity: 0.78 },
      },
    ],
  }
})

const visibleRecommendations = computed(() =>
  problemRecommendations.filter(
    (item) =>
      !store.accounts.length ||
      store.accounts.some((account) => account.platform === item.platform),
  ),
)
</script>

<template>
  <div class="page-stack dashboard-page">
    <section class="hero-panel hero-dashboard">
      <div>
        <p class="eyebrow">AI Multi-OJ Analytics</p>
        <h2>AlgoLink 训练数据看板</h2>
        <p>
          Dashboard 优先使用 {{ dataSourceLabel }} 生成摘要、趋势、标签压力和 AI Coach 联动；本阶段不新增
          OJ API、后端、登录、评测或真实 AI API。
        </p>
        <div class="hero-actions">
          <RouterLink to="/accounts">同步 Codeforces</RouterLink>
          <RouterLink to="/submissions" class="secondary-link">查看提交记录</RouterLink>
        </div>
      </div>
      <div class="hero-scoreboard" aria-label="Solved problems">
        <span>去重已解决</span>
        <strong>{{ analysis.solvedProblems }}</strong>
        <p>{{ analysis.total }} 次提交，AC 率 {{ analysis.acceptanceRate }}%</p>
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="当前 Rating" :value="dashboardAccount?.rating || '-'" helper="来自 Codeforces user.info" />
      <StatCard label="最高 Rating" :value="dashboardAccount?.maxRating || dashboardAccount?.rating || '-'" helper="Codeforces 历史最高分" />
      <StatCard label="30 天提交" :value="analysis.recent30Total" helper="最近训练量" />
      <StatCard label="30 天 AC" :value="analysis.recent30Accepted" helper="最近通过提交数" />
      <StatCard label="已解决" :value="analysis.solvedProblems" helper="按题目去重后的 AC 数" />
      <StatCard label="高频标签" :value="analysis.topTrainingTag" helper="最常训练方向" />
      <StatCard label="薄弱标签" :value="analysis.weakestTag" helper="失败压力最高的标签" />
      <StatCard label="最近同步" :value="dashboardAccount?.lastSyncAt || '-'" helper="保存在 localStorage" />
    </section>

    <section class="panel heatmap-panel">
      <div class="panel-heading heatmap-heading">
        <div>
          <p class="eyebrow">Codeforces Activity</p>
          <h2>训练热力图</h2>
        </div>
        <span class="count-badge">
          {{ heatmapSummary.total }} 次提交 / {{ heatmapSummary.activeDays }} 天活跃
        </span>
      </div>
      <div class="heatmap-wrap">
        <div class="heatmap-months" aria-hidden="true">
          <span
            v-for="month in heatmapMonthLabels"
            :key="`${month.name}-${month.column}`"
            :style="{ gridColumn: `${month.column} / span ${month.span}` }"
          >
            {{ month.name }}
          </span>
        </div>
        <div class="heatmap-body">
          <div class="heatmap-weekdays" aria-hidden="true">
            <span
              v-for="weekday in heatmapWeekdayLabels"
              :key="weekday.label"
              :style="{ gridRow: weekday.row }"
            >
              {{ weekday.label }}
            </span>
          </div>
          <div class="heatmap-grid" aria-label="Codeforces activity heatmap">
            <span
              v-for="day in heatmapDays"
              :key="day.key"
              class="heatmap-cell"
              :class="`level-${day.level}`"
              :title="`${day.dateLabel}: ${day.count} submissions`"
              :aria-label="`${day.dateLabel}: ${day.count} submissions`"
            />
          </div>
        </div>
        <div class="heatmap-legend" aria-hidden="true">
          <span>Less</span>
          <i class="heatmap-cell level-0" />
          <i class="heatmap-cell level-1" />
          <i class="heatmap-cell level-2" />
          <i class="heatmap-cell level-3" />
          <i class="heatmap-cell level-4" />
          <span>More</span>
        </div>
      </div>
    </section>

    <section class="panel today-advice">
      <div>
        <p class="eyebrow">Today AI Suggestion</p>
        <h2>今日重点：{{ analysis.weakestTag }}</h2>
        <p>
          最近 30 天共有 {{ analysis.recent30Total }} 次提交、{{ analysis.recent30Accepted }} 次 AC。
          AI Coach 会基于这些统计生成规则化 mock 建议。
        </p>
      </div>
      <div class="hero-actions">
        <RouterLink to="/ai-advice">打开 AI Coach</RouterLink>
        <RouterLink to="/training-plan" class="secondary-link">训练计划</RouterLink>
      </div>
    </section>

    <section class="sync-strip">
      <article v-for="item in store.platformSyncCards" :key="item.platform" class="sync-card">
        <div class="sync-head">
          <strong>{{ item.platform }}</strong>
          <span :class="item.account ? 'sync-synced' : 'sync-queued'">{{ item.status }}</span>
        </div>
        <div class="sync-meter"><i :style="{ width: `${item.coverage}%` }" /></div>
        <p>{{ item.account ? `@${item.account.handle}` : '尚未绑定公开 handle' }}</p>
        <footer>
          <span>最近同步</span>
          <span>{{ item.lastSyncAt }}</span>
        </footer>
      </article>
    </section>

    <section class="content-grid">
      <ChartPanel title="提交趋势" :option="trendOption" />
      <ChartPanel title="标签分布 Top 8" :option="tagOption" />
    </section>

    <section class="content-grid">
      <article class="panel panel-prominent">
        <div class="panel-heading">
          <h2>推荐训练入口</h2>
          <RouterLink class="text-link" to="/ai-advice">打开 AI Coach</RouterLink>
        </div>
        <div class="recommend-list">
          <article v-for="item in visibleRecommendations" :key="item.id" class="recommend-card">
            <div>
              <span class="fit-score">{{ item.fitScore }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.platform }} / {{ item.difficulty }} / {{ item.reason }}</p>
            </div>
            <div>
              <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </article>
        </div>
      </article>

      <article class="panel panel-subtle">
        <div class="panel-heading">
          <h2>数据范围</h2>
        </div>
        <div class="stat-list">
          <div>
            <span>主要来源</span>
            <strong>{{ dataSourceLabel }}</strong>
          </div>
          <div>
            <span>AI 模式</span>
            <strong>本地规则 mock</strong>
          </div>
          <div>
            <span>计划进度</span>
            <strong>{{ store.weeklyPlanCompletion }}%</strong>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

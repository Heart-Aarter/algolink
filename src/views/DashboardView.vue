<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import { mockAccounts, problemRecommendations } from '@/mock/algolink'
import { useAlgoLinkStore } from '@/stores/algolink'
import {
  calculateSubmissionAnalysis,
  getDifficultyBucket,
  getDifficultyBucketLabel,
  getDifficultyLabelColor,
  getProblemKey,
  parseSubmittedAt,
  sortDifficultyDistribution,
} from '@/utils/analysis'
import { chartAxis, chartGrid, tooltipBase } from '@/utils/chartTheme'
import { formatDateKey } from '@/utils/date'
import { getDisplayTags } from '@/utils/tags'
import { getVerdictCode } from '@/utils/verdict'

const store = useAlgoLinkStore()

const syncedAccount = computed(() =>
  store.accounts.find(
    (account) =>
      account.platform === 'Codeforces' &&
      (account.solved > 0 || account.rating > 0 || (account.maxRating ?? 0) > 0),
  ),
)
const fallbackCodeforcesAccount = computed(() =>
  mockAccounts.find((account) => account.platform === 'Codeforces'),
)
const dashboardAccount = computed(() => syncedAccount.value ?? fallbackCodeforcesAccount.value)
const dashboardSubmissions = computed(() => store.analysisSubmissions)
const analysis = computed(() => calculateSubmissionAnalysis(dashboardSubmissions.value))

const productHighlights = computed(() => [
  {
    label: '数据聚合',
    value: `${store.supportedPlatforms.length} OJ`,
    text: '公开 handle 绑定与同步',
  },
  { label: '训练诊断', value: analysis.value.weakestTag, text: '自动识别薄弱标签' },
  { label: 'AI Coach', value: 'Rules', text: '规则化 mock 分析建议' },
])

const dayMs = 24 * 60 * 60 * 1000
const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const heatmapWeekdayLabels = [
  { label: 'Mon', row: 2 },
  { label: 'Wed', row: 4 },
  { label: 'Fri', row: 6 },
]

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
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
  const starts: { name: string; column: number }[] = []
  let currentMonth = ''

  heatmapDays.value.forEach((day, index) => {
    const month = `${day.date.getFullYear()}-${day.date.getMonth()}`

    if (month === currentMonth) {
      return
    }

    currentMonth = month
    starts.push({
      name: monthNames[day.date.getMonth()] ?? '',
      column: Math.floor(index / 7) + 1,
    })
  })

  const totalWeeks = heatmapWeekCount.value

  return starts
    .map((label, index) => {
      const nextColumn = starts[index + 1]?.column ?? totalWeeks + 1
      const span = Math.max(1, nextColumn - label.column)
      const centerColumn = label.column + Math.floor(span / 2)
      return { ...label, span, centerColumn }
    })
    .filter((label) => label.span >= 2)
})

const heatmapWeekCount = computed(() => Math.ceil(heatmapDays.value.length / 7))

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
  color: ['#8cab9f', '#c28a2e'],
  grid: { top: 36, right: 18, bottom: 34, left: 38 },
  tooltip: {
    trigger: 'axis',
    ...tooltipBase,
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
    color: ['#c28a2e'],
    grid: { top: 36, right: 18, bottom: 34, left: 96 },
    tooltip: {
      trigger: 'axis',
      ...tooltipBase,
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
      axisLabel: { color: '#b3aa9b' },
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

const difficultyLegendItems = computed(() =>
  sortDifficultyDistribution(analysis.value.difficultyDistribution).map((item) => ({
    ...item,
    color: getDifficultyLabelColor(item.name),
  })),
)

const difficultySolvedItems = computed(() => {
  const solvedProblems = new Set<string>()
  const counts = new Map<string, number>()

  for (const submission of dashboardSubmissions.value) {
    if (submission.status !== 'Accepted') {
      continue
    }

    const problemKey = getProblemKey(submission)

    if (solvedProblems.has(problemKey)) {
      continue
    }

    solvedProblems.add(problemKey)
    const difficultyLabel = getDifficultyBucketLabel(getDifficultyBucket(submission.difficulty))
    counts.set(difficultyLabel, (counts.get(difficultyLabel) ?? 0) + 1)
  }

  return sortDifficultyDistribution(
    [...counts.entries()].map(([name, value]) => ({
      name,
      value,
      color: getDifficultyLabelColor(name),
    })),
  )
})

const topSolvedDifficultyItem = computed(() =>
  difficultySolvedItems.value.reduce(
    (top, item) => (item.value > top.value ? item : top),
    difficultySolvedItems.value[0] ?? { name: '-', value: 0, color: chartAxis },
  ),
)

const difficultyOption = computed<EChartsOption>(() => ({
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: '43%',
      style: {
        text: String(analysis.value.solvedProblems),
        fill: topSolvedDifficultyItem.value.color,
        fontSize: 30,
        fontWeight: 850,
        textAlign: 'center',
      },
    },
    {
      type: 'text',
      left: 'center',
      top: '57%',
      style: {
        text: '已解决',
        fill: chartAxis,
        fontSize: 12,
        fontWeight: 700,
        textAlign: 'center',
      },
    },
  ],
  tooltip: {
    trigger: 'item',
    ...tooltipBase,
  },
  series: [
    {
      name: 'Difficulty',
      type: 'pie',
      radius: ['52%', '78%'],
      center: ['50%', '52%'],
      clockwise: true,
      startAngle: 90,
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: sortDifficultyDistribution(analysis.value.difficultyDistribution).map((item) => ({
        ...item,
        itemStyle: { color: getDifficultyLabelColor(item.name) },
      })),
    },
  ],
}))

const visibleRecommendations = computed(() =>
  problemRecommendations.filter(
    (item) =>
      !store.accounts.length ||
      store.accounts.some((account) => account.platform === item.platform),
  ),
)
const mobileRecentSubmissions = computed(() => dashboardSubmissions.value.slice(0, 5))
</script>

<template>
  <div class="page-stack dashboard-page">
    <section class="product-hero dashboard-desktop-hero">
      <div class="product-hero-copy">
        <div class="product-brand-row">
          <p class="eyebrow">AI Multi-OJ Training Intelligence</p>
          <span>ALGOLINK 2026</span>
        </div>
        <div class="product-event-band">
          <span>公开数据聚合</span>
          <strong>AI TRAINING ANALYTICS</strong>
        </div>
        <h2>AlgoLink</h2>
        <p class="product-slogan">
          面向算法竞赛学习者的 AI 多 OJ
          刷题数据分析平台，聚合公开训练记录，生成趋势看板、能力画像、训练报告和下一阶段建议。
        </p>
        <div class="hero-actions product-hero-actions">
          <RouterLink to="/accounts">同步 Codeforces</RouterLink>
          <RouterLink to="/training-report" class="secondary-link">生成训练报告</RouterLink>
          <RouterLink to="/profile" class="secondary-link">查看能力画像</RouterLink>
        </div>
      </div>

      <div class="product-hero-visual" aria-label="AlgoLink product summary">
        <div class="product-live-pill">AI REPORT</div>
        <div class="hero-scoreboard hero-scoreboard-prominent">
          <span>已解决题目</span>
          <strong>{{ analysis.solvedProblems }}</strong>
          <p>{{ analysis.total }} 次提交，AC 率 {{ analysis.acceptanceRate }}%</p>
        </div>
        <div class="product-highlight-grid">
          <article v-for="item in productHighlights" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="panel mobile-dashboard-insight">
      <div>
        <p class="eyebrow">Mobile Command</p>
        <h2>{{ analysis.weakestTag }} 需要优先复盘</h2>
        <p>
          最近 30 天 {{ analysis.recent30Total }} 次提交，AC {{ analysis.recent30Accepted }} 次。建议先复盘非 AC
          记录，再推进下一组训练计划。
        </p>
      </div>
      <RouterLink to="/ai-advice">打开 Coach</RouterLink>
    </section>

    <section class="hero-panel hero-dashboard dashboard-desktop-summary">
      <div>
        <p class="eyebrow">AI Multi-OJ Analytics</p>
        <h2>AlgoLink 训练数据看板</h2>
        <p>
          Dashboard 优先使用 {{ store.submissionDataSourceLabel }} 生成摘要、趋势、标签压力和 AI Coach
          联动；本阶段不新增 OJ 密码登录、评测或真实 AI API。
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
      <StatCard
        label="当前 Rating"
        :value="dashboardAccount?.rating || '-'"
        helper="来自 Codeforces user.info"
      />
      <StatCard
        label="最高 Rating"
        :value="dashboardAccount?.maxRating || dashboardAccount?.rating || '-'"
        helper="Codeforces 历史最高分"
      />
      <StatCard label="30 天提交" :value="analysis.recent30Total" helper="最近训练量" />
      <StatCard label="30 天 AC" :value="analysis.recent30Accepted" helper="最近通过提交数" />
      <StatCard label="已解决" :value="analysis.solvedProblems" helper="按题目去重后的 AC 数" />
      <StatCard label="高频标签" :value="analysis.topTrainingTag" helper="最常训练方向" />
      <StatCard label="薄弱标签" :value="analysis.weakestTag" helper="失败压力最高的标签" />
      <StatCard
        label="最近同步"
        :value="dashboardAccount?.lastSyncAt || '-'"
        helper="SQLite 持久化"
      />
    </section>

    <section class="activity-grid">
      <article class="panel heatmap-panel">
        <div class="panel-heading heatmap-heading">
          <div>
            <p class="eyebrow">Multi-OJ Activity</p>
            <h2>训练热力图</h2>
          </div>
          <span class="count-badge">
            {{ heatmapSummary.total }} 次提交 / {{ heatmapSummary.activeDays }} 天活跃
          </span>
        </div>
        <div class="heatmap-wrap">
          <div
            class="heatmap-months"
            :style="{ '--heatmap-week-count': heatmapWeekCount }"
            aria-hidden="true"
          >
            <span
              v-for="month in heatmapMonthLabels"
              :key="`${month.name}-${month.column}`"
              :style="{ gridColumn: `${month.centerColumn} / span 1` }"
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
            <div
              class="heatmap-grid"
              :style="{ '--heatmap-week-count': heatmapWeekCount }"
              aria-label="Multi-OJ activity heatmap"
            >
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
      </article>
      <ChartPanel title="题目难度分布" :option="difficultyOption">
        <div class="difficulty-legend-card" aria-label="Difficulty color legend">
          <div v-for="item in difficultyLegendItems" :key="item.name" class="difficulty-legend-row">
            <i :style="{ background: item.color }" />
            <span>{{ item.name }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </ChartPanel>
    </section>

    <section class="panel mobile-recent-submissions">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Recent Stream</p>
          <h2>最近提交</h2>
        </div>
        <RouterLink class="text-link" to="/submissions">全部</RouterLink>
      </div>
      <div class="mobile-submission-list">
        <article
          v-for="submission in mobileRecentSubmissions"
          :key="submission.id"
          class="mobile-submission-card"
        >
          <div class="mobile-submission-main">
            <span>{{ submission.platform }}</span>
            <strong>{{ submission.problem }}</strong>
            <small>{{ submission.problemId || submission.submittedAt }}</small>
          </div>
          <div class="mobile-submission-meta">
            <span
              class="mobile-verdict-chip"
              :class="{ accepted: submission.status === 'Accepted' }"
            >
              {{ getVerdictCode(submission.status) }}
            </span>
            <span>{{ submission.difficulty }}</span>
          </div>
          <div class="mobile-submission-tags">
            <span v-for="tag in getDisplayTags(submission).slice(0, 3)" :key="tag">{{ tag }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="panel today-advice">
      <div>
        <p class="eyebrow">Today AI Suggestion</p>
        <h2>今日重点：{{ analysis.weakestTag }}</h2>
        <p>
          最近 30 天共有 {{ analysis.recent30Total }} 次提交、{{ analysis.recent30Accepted }} 次
          AC。 AI Coach 会基于这些统计生成规则化 mock 建议。
        </p>
      </div>
      <div class="hero-actions">
        <RouterLink to="/ai-advice">打开 AI Coach</RouterLink>
        <RouterLink to="/training-plan" class="secondary-link">训练计划</RouterLink>
      </div>
    </section>

    <section class="report-entry-panel">
      <div>
        <p class="eyebrow">Training Report</p>
        <h2>生成训练报告</h2>
        <p>
          将已同步的 Codeforces
          提交记录整理成一份训练诊断书，适合展示近期状态、强弱项、难度结构和下一阶段建议。
        </p>
      </div>
      <div class="report-entry-meta">
        <span>Synced Submissions</span>
        <strong>{{ store.syncedSubmissions.length }}</strong>
      </div>
      <RouterLink class="report-entry-action" to="/training-report">生成报告</RouterLink>
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
            <strong>{{ store.submissionDataSourceLabel }}</strong>
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
    <RouterLink class="mobile-sync-fab" to="/accounts">同步</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import { problemRecommendations } from '@/mock/algolink'
import { useAlgoLinkStore } from '@/stores/algolink'
import { getTrainingSummary } from '@/utils/analysis'

const store = useAlgoLinkStore()

const analysisSubmissions = computed(() =>
  store.boundSubmissions.length ? store.boundSubmissions : store.submissions,
)
const codeforcesAccount = computed(() =>
  store.accounts.find((account) => account.platform === 'Codeforces'),
)
const rejectedCount = computed(
  () => analysisSubmissions.value.filter((item) => item.status !== 'Accepted').length,
)
const aiSummary = computed(() => getTrainingSummary(analysisSubmissions.value))
const todayAdvice = computed(() => ({
  theme: store.todayPlan?.theme ?? 'DP 边界与初始化',
  problemCount: store.todayPlan?.problemCount ?? 3,
  weakTags: aiSummary.value.weakTags.length ? aiSummary.value.weakTags : ['dp', 'math'],
}))

const chartAxis = '#738195'
const chartGrid = 'rgba(154, 170, 190, 0.1)'

const dailyStats = computed(() => {
  const stats = new Map<string, { solved: number; attempts: number }>()

  for (const submission of analysisSubmissions.value) {
    const date = submission.submittedAt.slice(5, 10)
    const current = stats.get(date) ?? { solved: 0, attempts: 0 }
    current.attempts += 1
    current.solved += submission.status === 'Accepted' ? 1 : 0
    stats.set(date, current)
  }

  return [...stats.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date, ...value }))
})

const tagStats = computed(() => {
  const stats = new Map<string, number>()

  for (const submission of analysisSubmissions.value) {
    for (const tag of submission.tags) {
      stats.set(tag, (stats.get(tag) ?? 0) + 1)
    }
  }

  return [...stats.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))
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
      data: dailyStats.value.map((item) => item.solved),
      itemStyle: { borderRadius: [5, 5, 0, 0], opacity: 0.82 },
    },
    {
      name: '提交',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: { width: 2 },
      data: dailyStats.value.map((item) => item.attempts),
    },
  ],
}))

const tagOption = computed<EChartsOption>(() => ({
  color: ['#8db1c7'],
  grid: { top: 36, right: 18, bottom: 34, left: 82 },
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
    data: tagStats.value.map((item) => item.tag),
    axisLine: { lineStyle: { color: 'rgba(154, 170, 190, 0.18)' } },
    axisTick: { show: false },
    axisLabel: { color: '#aab6c5' },
  },
  series: [
    {
      name: '出现次数',
      type: 'bar',
      barMaxWidth: 14,
      data: tagStats.value.map((item) => item.count),
      itemStyle: { borderRadius: [0, 5, 5, 0], opacity: 0.78 },
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
</script>

<template>
  <div class="page-stack dashboard-page">
    <section class="hero-panel hero-dashboard">
      <div>
        <p class="eyebrow">AI Multi-OJ Analytics</p>
        <h2>AlgoLink 刷题数据分析面板</h2>
        <p>绑定公开 OJ handle 后，Dashboard 会从 localStorage 读取账号，并基于本地 mock 提交记录生成统计。</p>
        <div class="hero-actions">
          <RouterLink to="/accounts">绑定账号</RouterLink>
          <RouterLink to="/submissions" class="secondary-link">查看提交记录</RouterLink>
        </div>
      </div>
      <div class="hero-scoreboard" aria-label="公开账号数量">
        <span>公开账号</span>
        <strong>{{ store.accounts.length }}</strong>
        <p>{{ store.accounts.length ? '已接入本地分析闭环' : '绑定账号后开始生成分析' }}</p>
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="公开账号" :value="store.accounts.length" helper="来自 localStorage 的绑定数量" />
      <StatCard label="AC 数" :value="store.totalSolved" helper="已绑定平台 mock 记录统计" />
      <StatCard label="通过率" :value="`${store.acceptanceRate}%`" helper="按已绑定平台提交计算" />
      <StatCard label="未通过" :value="rejectedCount" helper="WA / TLE / RE 合计" />
    </section>

    <section v-if="codeforcesAccount" class="stats-grid">
      <StatCard
        label="CF 当前 Rating"
        :value="codeforcesAccount.rating || '-'"
        helper="同步成功后展示真实 Codeforces rating"
      />
      <StatCard
        label="CF 最高 Rating"
        :value="codeforcesAccount.maxRating || '-'"
        helper="来自 Codeforces user.info"
      />
      <StatCard
        label="最近提交"
        :value="analysisSubmissions.length"
        helper="真实 CF 优先，其他平台 mock 兜底"
      />
      <StatCard label="未通过" :value="rejectedCount" helper="WA / TLE / RE 合计" />
    </section>

    <section class="panel today-advice">
      <div>
        <p class="eyebrow">Today AI Suggestion</p>
        <h2>今日 AI 建议</h2>
        <p>
          今日训练主题：{{ todayAdvice.theme }}；推荐 {{ todayAdvice.problemCount }} 题；优先关注
          {{ todayAdvice.weakTags.join(' / ') }}。
        </p>
      </div>
      <div class="hero-actions">
        <RouterLink to="/ai-advice">查看 AI Coach</RouterLink>
        <RouterLink to="/training-plan" class="secondary-link">打开训练计划</RouterLink>
      </div>
    </section>

    <section v-if="!store.accounts.length" class="panel empty-state">
      <h3>还没有绑定任何 OJ 账号</h3>
      <p>请先绑定 Codeforces、Luogu、AtCoder 或 LeetCode 的公开用户名，其他页面会同步读取绑定状态。</p>
      <RouterLink class="text-link" to="/accounts">去绑定账号</RouterLink>
    </section>

    <section class="sync-strip">
      <article v-for="item in store.platformSyncCards" :key="item.platform" class="sync-card">
        <div class="sync-head">
          <strong>{{ item.platform }}</strong>
          <span :class="item.account ? 'sync-synced' : 'sync-queued'">{{ item.status }}</span>
        </div>
        <div class="sync-meter"><i :style="{ width: `${item.coverage}%` }" /></div>
        <p>
          {{ item.account ? `@${item.account.handle}` : '尚未绑定公开 handle' }}
        </p>
        <footer>
          <span>最近同步</span>
          <span>{{ item.lastSyncAt }}</span>
        </footer>
      </article>
    </section>

    <section v-if="store.accounts.length" class="content-grid">
      <ChartPanel title="绑定平台提交趋势" :option="trendOption" />
      <ChartPanel title="标签分布 Top 8" :option="tagOption" />
    </section>

    <section v-if="store.accounts.length" class="content-grid">
      <article class="panel panel-prominent">
        <div class="panel-heading">
          <h2>训练建议入口</h2>
          <RouterLink class="text-link" to="/ai-advice">查看 AI 建议</RouterLink>
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
          <h2>闭环状态</h2>
        </div>
        <div class="stat-list">
          <div>
            <span>账号来源</span>
            <strong>localStorage</strong>
          </div>
          <div>
            <span>提交来源</span>
            <strong>mock 数据</strong>
          </div>
          <div>
            <span>训练计划</span>
            <strong>{{ store.weeklyPlanCompletion }}%</strong>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

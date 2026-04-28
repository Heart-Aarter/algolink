<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform, SubmissionStatus } from '@/types/algolink'

const store = useAlgoLinkStore()
const analysisSubmissions = computed(() =>
  store.boundSubmissions.length ? store.boundSubmissions : store.submissions,
)

const acceptedCount = computed(
  () => analysisSubmissions.value.filter((item) => item.status === 'Accepted').length,
)

const failedStats = computed<Record<Exclude<SubmissionStatus, 'Accepted'>, number>>(() => ({
  'Wrong Answer': analysisSubmissions.value.filter((item) => item.status === 'Wrong Answer')
    .length,
  'Time Limit': analysisSubmissions.value.filter((item) => item.status === 'Time Limit').length,
  'Runtime Error': analysisSubmissions.value.filter((item) => item.status === 'Runtime Error')
    .length,
}))

const tagDistribution = computed(() => {
  const stats = new Map<string, number>()

  for (const submission of analysisSubmissions.value) {
    for (const tag of submission.tags) {
      stats.set(tag, (stats.get(tag) ?? 0) + 1)
    }
  }

  return [...stats.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
})

const platformDistribution = computed(() => {
  const stats = new Map<OjPlatform, number>()

  for (const submission of analysisSubmissions.value) {
    stats.set(submission.platform, (stats.get(submission.platform) ?? 0) + 1)
  }

  return [...stats.entries()].map(([name, value]) => ({ name, value }))
})

const difficultyDistribution = computed(() => {
  const stats = new Map<string, number>()

  for (const submission of analysisSubmissions.value) {
    stats.set(submission.difficulty, (stats.get(submission.difficulty) ?? 0) + 1)
  }

  return [...stats.entries()]
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([name, value]) => ({ name, value }))
})

const chartAxis = '#738195'
const chartGrid = 'rgba(154, 170, 190, 0.1)'

const tagOption = computed<EChartsOption>(() => ({
  color: ['#66d6cb'],
  grid: { top: 36, right: 18, bottom: 34, left: 92 },
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
    data: tagDistribution.value.map((item) => item.name).slice(0, 8),
    axisTick: { show: false },
    axisLabel: { color: '#aab6c5' },
  },
  series: [
    {
      name: '提交数',
      type: 'bar',
      data: tagDistribution.value.map((item) => item.value).slice(0, 8),
      itemStyle: { borderRadius: [0, 5, 5, 0], opacity: 0.82 },
    },
  ],
}))

const platformOption = computed<EChartsOption>(() => ({
  color: ['#7fa4d8', '#78c891', '#8db1c7', '#d9a76f'],
  tooltip: {
    trigger: 'item',
    backgroundColor: '#151d29',
    borderColor: 'rgba(154, 170, 190, 0.18)',
    textStyle: { color: '#dce5ef' },
  },
  series: [
    {
      name: '平台提交',
      type: 'pie',
      radius: ['48%', '70%'],
      data: platformDistribution.value,
      label: { color: '#aab6c5' },
    },
  ],
}))

const difficultyOption = computed<EChartsOption>(() => ({
  color: ['#d9a76f'],
  grid: { top: 36, right: 18, bottom: 34, left: 48 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#151d29',
    borderColor: 'rgba(154, 170, 190, 0.18)',
    textStyle: { color: '#dce5ef' },
  },
  xAxis: {
    type: 'category',
    data: difficultyDistribution.value.map((item) => item.name),
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
      name: '提交数',
      type: 'bar',
      data: difficultyDistribution.value.map((item) => item.value),
      itemStyle: { borderRadius: [5, 5, 0, 0], opacity: 0.82 },
    },
  ],
}))
</script>

<template>
  <div class="page-stack">
    <section class="stats-grid">
      <StatCard label="AC 数" :value="acceptedCount" helper="Accepted mock 提交数" />
      <StatCard label="Wrong Answer" :value="failedStats['Wrong Answer']" helper="答案错误记录" />
      <StatCard label="Time Limit" :value="failedStats['Time Limit']" helper="超时记录" />
      <StatCard label="Runtime Error" :value="failedStats['Runtime Error']" helper="运行错误记录" />
    </section>

    <section v-if="!analysisSubmissions.length" class="panel empty-state">
      <h3>暂无能力画像</h3>
      <p>请先绑定公开 OJ 账号，系统会根据已绑定平台的 mock 提交记录计算 AC、错误类型、标签和平台分布。</p>
      <RouterLink class="text-link" to="/accounts">去绑定账号</RouterLink>
    </section>

    <template v-else>
      <section class="content-grid wide-left">
        <ChartPanel title="标签分布" :option="tagOption" />
        <ChartPanel title="平台分布" :option="platformOption" />
      </section>

      <section class="content-grid">
        <ChartPanel title="难度分布" :option="difficultyOption" />
        <article class="panel">
          <div class="panel-heading">
            <h2>标签统计</h2>
          </div>
          <div class="distribution-list">
            <div v-for="tag in tagDistribution" :key="tag.name">
              <span>{{ tag.name }}</span>
              <div class="meter">
                <i :style="{ width: `${(tag.value / Math.max(tagDistribution[0]?.value ?? 1, 1)) * 100}%` }" />
              </div>
              <strong>{{ tag.value }}</strong>
            </div>
          </div>
        </article>

        <article class="panel panel-subtle">
          <div class="panel-heading">
            <h2>平台统计</h2>
          </div>
          <div class="distribution-list">
            <div v-for="platform in platformDistribution" :key="platform.name">
              <span>{{ platform.name }}</span>
              <div class="meter">
                <i :style="{ width: `${(platform.value / analysisSubmissions.length) * 100}%` }" />
              </div>
              <strong>{{ platform.value }}</strong>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

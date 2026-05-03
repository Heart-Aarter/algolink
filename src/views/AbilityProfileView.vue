<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { NEmpty } from 'naive-ui'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import {
  calculateSubmissionAnalysis,
  getDifficultyLabelColor,
  sortDifficultyDistribution,
  type DistributionItem,
} from '@/utils/analysis'

const store = useAlgoLinkStore()

const analysisSubmissions = computed(() =>
  store.hasSyncedSubmissions ? store.syncedSubmissions : store.submissions,
)
const analysis = computed(() => calculateSubmissionAnalysis(analysisSubmissions.value))
const dataSourceLabel = computed(() => store.submissionDataSourceLabel)

const chartAxis = '#8f877a'
const chartGrid = 'rgba(142, 39, 36, 0.11)'

function barOption(
  items: DistributionItem[],
  color: string,
  getItemColor?: (name: string) => string,
): EChartsOption {
  const visibleItems = items.slice(0, 10).reverse()

  return {
    color: [color],
    grid: { top: 26, right: 18, bottom: 26, left: 104 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1c1d1b',
      borderColor: 'rgba(194, 138, 46, 0.28)',
      textStyle: { color: '#f5f0e7' },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: chartGrid } },
      axisLabel: { color: chartAxis },
    },
    yAxis: {
      type: 'category',
      data: visibleItems.map((item) => item.name),
      axisTick: { show: false },
      axisLabel: { color: '#b3aa9b' },
    },
    series: [
      {
        name: 'Submissions',
        type: 'bar',
        data: visibleItems.map((item) => ({
          value: item.value,
          itemStyle: getItemColor ? { color: getItemColor(item.name) } : undefined,
        })),
        itemStyle: { borderRadius: [0, 5, 5, 0], opacity: 0.84 },
      },
    ],
  }
}

function pieOption(items: DistributionItem[], colors: string[]): EChartsOption {
  return {
    color: colors,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1c1d1b',
      borderColor: 'rgba(194, 138, 46, 0.28)',
      textStyle: { color: '#f5f0e7' },
    },
    series: [
      {
        name: 'Submissions',
        type: 'pie',
        radius: ['46%', '70%'],
        data: items,
        label: { color: '#b3aa9b' },
      },
    ],
  }
}

const tagOption = computed(() => barOption(analysis.value.tagDistribution, '#8cab9f'))
const difficultyOption = computed(() =>
  barOption(
    sortDifficultyDistribution(analysis.value.difficultyDistribution),
    '#c28a2e',
    getDifficultyLabelColor,
  ),
)
const verdictOption = computed(() =>
  pieOption(analysis.value.verdictDistribution, [
    '#8cab9f',
    '#8e2724',
    '#c28a2e',
    '#b77955',
    '#6e9286',
    '#8f877a',
  ]),
)
const languageOption = computed(() => barOption(analysis.value.languageDistribution, '#8cab9f'))
</script>

<template>
  <div class="page-stack">
    <section class="stats-grid">
      <StatCard label="总提交" :value="analysis.total" :helper="dataSourceLabel" />
      <StatCard label="AC 提交" :value="analysis.accepted" helper="Accepted 提交数量" />
      <StatCard label="非 AC" :value="analysis.nonAccepted" helper="WA / TLE / RE / CE / UNKNOWN" />
      <StatCard label="已解决" :value="analysis.solvedProblems" helper="至少一次 AC 的去重题目数" />
      <StatCard label="30 天提交" :value="analysis.recent30Total" helper="最近训练活跃度" />
      <StatCard label="30 天 AC" :value="analysis.recent30Accepted" helper="最近通过提交数" />
      <StatCard label="高频标签" :value="analysis.topTrainingTag" helper="当前最常训练主题" />
      <StatCard label="薄弱标签" :value="analysis.weakestTag" helper="失败压力最高的标签" />
    </section>

    <section v-if="!analysisSubmissions.length" class="panel">
      <n-empty description="暂无可分析数据" class="empty-state naive-empty">
        <template #extra>
          <RouterLink class="text-link" to="/accounts">前往账号绑定</RouterLink>
        </template>
      </n-empty>
    </section>

    <template v-else>
      <section class="content-grid wide-left">
        <ChartPanel title="标签分布" :option="tagOption" />
        <ChartPanel title="结果分布" :option="verdictOption" />
      </section>

      <section class="content-grid">
        <ChartPanel title="难度分布" :option="difficultyOption" />
        <ChartPanel title="语言分布" :option="languageOption" />
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-heading">
            <h2>标签通过率</h2>
          </div>
          <div class="distribution-list">
            <div v-for="tag in analysis.tagAnalysis.slice(0, 8)" :key="tag.tag">
              <span>{{ tag.tag }}</span>
              <div class="meter">
                <i :style="{ width: `${tag.acceptanceRate}%` }" />
              </div>
              <strong>{{ tag.acceptanceRate }}%</strong>
            </div>
          </div>
        </article>

        <article class="panel panel-subtle">
          <div class="panel-heading">
            <h2>结果统计</h2>
          </div>
          <div class="stat-list">
            <div v-for="item in analysis.verdictDistribution" :key="item.name">
              <span>{{ item.name }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

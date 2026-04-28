<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import {
  abilityMetrics,
  platformSyncStates,
  problemRecommendations,
  topicInsights,
  trendSeries,
} from '@/mock/algolink'
import { useAlgoLinkStore } from '@/stores/algolink'

const store = useAlgoLinkStore()

const rejectedCount = computed(
  () => store.submissions.filter((item) => item.status !== 'Accepted').length,
)

const trendOption = computed<EChartsOption>(() => ({
  color: ['#25e2d3', '#4f8cff'],
  grid: { top: 28, right: 18, bottom: 34, left: 38 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: trendSeries.map((item) => item.date),
    axisLine: { lineStyle: { color: '#29405f' } },
    axisLabel: { color: '#8fa3bf' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'rgba(143, 163, 191, 0.14)' } },
    axisLabel: { color: '#8fa3bf' },
  },
  series: [
    {
      name: '通过',
      type: 'bar',
      barMaxWidth: 18,
      data: trendSeries.map((item) => item.solved),
      itemStyle: { borderRadius: [6, 6, 0, 0] },
    },
    {
      name: '提交',
      type: 'line',
      smooth: true,
      data: trendSeries.map((item) => item.attempts),
    },
  ],
}))

const topicOption = computed<EChartsOption>(() => ({
  color: ['#25e2d3', '#ffb86b'],
  grid: { top: 28, right: 18, bottom: 34, left: 64 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'value',
    max: 100,
    splitLine: { lineStyle: { color: 'rgba(143, 163, 191, 0.14)' } },
    axisLabel: { color: '#8fa3bf' },
  },
  yAxis: {
    type: 'category',
    data: topicInsights.map((item) => item.topic),
    axisLine: { lineStyle: { color: '#29405f' } },
    axisLabel: { color: '#dce8f7' },
  },
  series: [
    {
      name: '正确率',
      type: 'bar',
      data: topicInsights.map((item) => item.accuracy),
      itemStyle: { borderRadius: [0, 6, 6, 0] },
    },
  ],
}))

const topAbility = computed(() =>
  [...abilityMetrics].sort((a, b) => b.score - a.score).slice(0, 3),
)
</script>

<template>
  <div class="page-stack">
    <section class="hero-panel hero-dashboard">
      <div>
        <p class="eyebrow">AI Multi-OJ Analytics</p>
        <h2>把 Codeforces、洛谷、AtCoder 的公开刷题轨迹汇总成训练决策台</h2>
        <p>
          AlgoLink 第二阶段强化了同步状态、题型画像、AI 诊断、推荐题单和训练计划看板，让作品更像可演示的数据平台。
        </p>
        <div class="hero-actions">
          <RouterLink to="/ai-advice">查看 AI 训练建议</RouterLink>
          <RouterLink to="/training-plan" class="secondary-link">进入训练计划</RouterLink>
        </div>
      </div>
      <div class="hero-scoreboard" aria-label="综合训练指数">
        <span>训练指数</span>
        <strong>78.6</strong>
        <p>较上周 +6.8，主要来自贪心与 DP 题量恢复。</p>
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="累计解决" :value="store.totalSolved" helper="跨平台公开题目数量" />
      <StatCard label="最近通过率" :value="`${store.acceptanceRate}%`" helper="基于 mock 提交流计算" />
      <StatCard label="待处理异常" :value="rejectedCount" helper="WA / TLE / RE 需要复盘" />
      <StatCard label="活跃训练项" :value="store.activePlanCount" helper="进行中与待完成计划" />
    </section>

    <section class="sync-strip">
      <article v-for="item in platformSyncStates" :key="item.platform" class="sync-card">
        <div class="sync-head">
          <strong>{{ item.platform }}</strong>
          <span :class="`sync-${item.status}`">{{ item.status }}</span>
        </div>
        <div class="sync-meter"><i :style="{ width: `${item.coverage}%` }" /></div>
        <p>{{ item.note }}</p>
        <footer>
          <span>覆盖 {{ item.coverage }}%</span>
          <span>下次 {{ item.nextSync }}</span>
        </footer>
      </article>
    </section>

    <section class="content-grid">
      <ChartPanel title="近 7 天刷题趋势" :option="trendOption" />
      <ChartPanel title="题型正确率雷达前哨" :option="topicOption" />
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-heading">
          <h2>AI 推荐题单</h2>
          <RouterLink class="text-link" to="/ai-advice">查看完整分析</RouterLink>
        </div>
        <div class="recommend-list">
          <article v-for="item in problemRecommendations" :key="item.id" class="recommend-card">
            <div>
              <span class="fit-score">{{ item.fitScore }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.platform }} · {{ item.difficulty }} · {{ item.reason }}</p>
            </div>
            <div>
              <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </article>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <h2>能力高分项</h2>
        </div>
        <div class="ability-list">
          <div v-for="metric in topAbility" :key="metric.name" class="ability-row">
            <span>{{ metric.name }}</span>
            <div class="meter"><i :style="{ width: `${metric.score}%` }" /></div>
            <strong>{{ metric.score }}</strong>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import StatCard from '@/components/common/StatCard.vue'
import { abilityMetrics, trendSeries } from '@/mock/algolink'
import { useAlgoLinkStore } from '@/stores/algolink'

const store = useAlgoLinkStore()

const trendOption = computed<EChartsOption>(() => ({
  color: ['#25e2d3', '#4f8cff'],
  grid: { top: 24, right: 16, bottom: 32, left: 36 },
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
      type: 'line',
      smooth: true,
      data: trendSeries.map((item) => item.solved),
      areaStyle: { opacity: 0.18 },
    },
    {
      name: '提交',
      type: 'line',
      smooth: true,
      data: trendSeries.map((item) => item.attempts),
    },
  ],
}))

const platformOption = computed<EChartsOption>(() => ({
  color: store.accounts.map((item) => item.color),
  tooltip: { trigger: 'item' },
  series: [
    {
      name: '已解决题数',
      type: 'pie',
      radius: ['48%', '72%'],
      data: store.accounts.map((item) => ({ name: item.platform, value: item.solved })),
      label: { color: '#dce8f7' },
    },
  ],
}))

const topAbility = computed(() =>
  [...abilityMetrics].sort((a, b) => b.score - a.score).slice(0, 3),
)
</script>

<template>
  <div class="page-stack">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">AlgoLink 第一阶段</p>
        <h2>聚合公开 OJ 刷题数据，形成可视化训练工作台</h2>
        <p>
          当前使用 mock 数据和 localStorage 模拟账号绑定、提交记录、能力画像与 AI 训练建议。
        </p>
      </div>
      <div class="hero-matrix" aria-hidden="true">
        <span v-for="item in 18" :key="item" />
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="累计解决" :value="store.totalSolved" helper="跨平台公开题目数量" />
      <StatCard label="通过率" :value="`${store.acceptanceRate}%`" helper="基于最近 mock 提交" />
      <StatCard label="训练项" :value="store.activePlanCount" helper="进行中与待完成计划" />
      <StatCard label="绑定平台" :value="store.accounts.length" helper="Codeforces / 洛谷 / AtCoder" />
    </section>

    <section class="content-grid">
      <ChartPanel title="近 7 天刷题趋势" :option="trendOption" />
      <ChartPanel title="平台题量分布" :option="platformOption" />
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-heading">
          <h2>公开账号概览</h2>
        </div>
        <div class="account-list">
          <div v-for="account in store.accounts" :key="account.id" class="account-row">
            <span class="account-dot" :style="{ background: account.color }" />
            <div>
              <strong>{{ account.platform }}</strong>
              <p>@{{ account.handle }} · rating {{ account.rating || '待同步' }}</p>
            </div>
            <b>{{ account.solved }}</b>
          </div>
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

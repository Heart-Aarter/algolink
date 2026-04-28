<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import { abilityMetrics } from '@/mock/algolink'

const radarOption = computed<EChartsOption>(() => ({
  color: ['#25e2d3', '#4f8cff'],
  tooltip: {},
  radar: {
    indicator: abilityMetrics.map((item) => ({ name: item.name, max: 100 })),
    axisName: { color: '#dce8f7' },
    splitLine: { lineStyle: { color: 'rgba(143, 163, 191, 0.22)' } },
    splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
  },
  series: [
    {
      type: 'radar',
      data: [
        { name: '当前能力', value: abilityMetrics.map((item) => item.score) },
        { name: '阶段目标', value: abilityMetrics.map((item) => item.target) },
      ],
      areaStyle: { opacity: 0.18 },
    },
  ],
}))
</script>

<template>
  <div class="page-stack">
    <section class="content-grid wide-left">
      <ChartPanel title="能力雷达图" :option="radarOption" />
      <article class="panel">
        <div class="panel-heading">
          <h2>画像摘要</h2>
        </div>
        <p class="summary-text">
          当前优势集中在贪心和数据结构，图论模板稳定性仍需提升。数学与期望类题型离目标差距最大，适合作为下一轮训练主线。
        </p>
      </article>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>能力维度</h2>
      </div>
      <div class="ability-grid">
        <article v-for="metric in abilityMetrics" :key="metric.name" class="metric-card">
          <div class="metric-top">
            <h3>{{ metric.name }}</h3>
            <span :class="`trend-${metric.trend}`">{{ metric.trend }}</span>
          </div>
          <div class="meter"><i :style="{ width: `${metric.score}%` }" /></div>
          <p>当前 {{ metric.score }} / 目标 {{ metric.target }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

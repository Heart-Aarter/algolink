<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import { abilityMetrics, topicInsights } from '@/mock/algolink'

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

const gapList = computed(() =>
  abilityMetrics
    .map((item) => ({ ...item, gap: item.target - item.score }))
    .sort((a, b) => b.gap - a.gap),
)
</script>

<template>
  <div class="page-stack">
    <section class="content-grid wide-left">
      <ChartPanel title="能力画像雷达图" :option="radarOption" />
      <article class="panel profile-summary">
        <p class="eyebrow">Ability Portrait</p>
        <h2>当前训练重心应从“做对简单题”转向“稳定中高分题型模板”</h2>
        <p>
          贪心和数据结构是可迁移优势；数学、图论和期望 DP 是阶段缺口。平台会把这些差距转化为训练题单与复盘任务。
        </p>
      </article>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>能力差距排序</h2>
      </div>
      <div class="ability-grid">
        <article v-for="metric in gapList" :key="metric.name" class="metric-card">
          <div class="metric-top">
            <h3>{{ metric.name }}</h3>
            <span :class="`trend-${metric.trend}`">{{ metric.trend }}</span>
          </div>
          <div class="meter"><i :style="{ width: `${metric.score}%` }" /></div>
          <p>当前 {{ metric.score }} / 目标 {{ metric.target }}，差距 {{ metric.gap }}</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>题型诊断矩阵</h2>
      </div>
      <div class="topic-grid">
        <article v-for="topic in topicInsights" :key="topic.topic" class="topic-card">
          <div class="topic-head">
            <strong>{{ topic.topic }}</strong>
            <span>{{ topic.accuracy }}%</span>
          </div>
          <div class="meter"><i :style="{ width: `${topic.accuracy}%` }" /></div>
          <p>{{ topic.weakPoint }}</p>
          <b>{{ topic.nextAction }}</b>
          <small>已解决 {{ topic.solved }} 题</small>
        </article>
      </div>
    </section>
  </div>
</template>

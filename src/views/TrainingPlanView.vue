<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NButtonGroup, NCard, NTag } from 'naive-ui'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { TrainingPlanStatus } from '@/types/algolink'

const store = useAlgoLinkStore()

const statusLabels: Record<TrainingPlanStatus, string> = {
  'not-started': '未开始',
  doing: '进行中',
  done: '已完成',
}

const statusTypes: Record<TrainingPlanStatus, 'default' | 'warning' | 'success'> = {
  'not-started': 'default',
  doing: 'warning',
  done: 'success',
}

const statusOptions: TrainingPlanStatus[] = ['not-started', 'doing', 'done']

const totalProblems = computed(() =>
  store.weeklyPlanDays.reduce((sum, day) => sum + day.problemCount, 0),
)
const activeDays = computed(
  () => store.weeklyPlanDays.filter((day) => day.status !== 'not-started').length,
)

function updateDayStatus(id: string, status: TrainingPlanStatus) {
  store.updateWeeklyPlanStatus(id, status)
}
</script>

<template>
  <div class="page-stack">
    <section class="panel plan-overview">
      <div>
        <p class="eyebrow">7-Day Training Roadmap</p>
        <h2>本周训练完成度 {{ store.weeklyPlanCompletion }}%</h2>
        <p>
          计划围绕 DP、数学、图论和搜索的 mock 分析结果生成，状态保存在
          localStorage，刷新页面后仍会保留。
        </p>
      </div>
      <div class="plan-ring">
        <strong>{{ store.weeklyPlanCompletion }}%</strong>
        <span>完成</span>
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="训练天数" :value="store.weeklyPlanDays.length" helper="固定 7 天专题安排" />
      <StatCard label="推荐题量" :value="totalProblems" helper="按每日主题分配题目" />
      <StatCard label="已启动天数" :value="activeDays" helper="进行中或已完成的计划" />
      <StatCard label="状态存储" value="localStorage" helper="刷新后保持计划状态" />
    </section>

    <section class="weekly-plan-grid">
      <n-card
        v-for="day in store.weeklyPlanDays"
        :key="day.id"
        class="weekly-plan-card"
        :bordered="false"
        content-style="padding: 0;"
      >
        <div class="metric-top">
          <div>
            <span class="eyebrow">{{ day.dayLabel }}</span>
            <h3>{{ day.theme }}</h3>
          </div>
          <n-tag :type="statusTypes[day.status]" round>{{ statusLabels[day.status] }}</n-tag>
        </div>

        <div class="plan-meta">
          <n-tag size="small" round>{{ day.problemCount }} 题</n-tag>
          <n-tag v-for="tag in day.tags" :key="tag" size="small" round>{{ tag }}</n-tag>
        </div>

        <div>
          <strong>训练目标</strong>
          <p>{{ day.goal }}</p>
        </div>

        <div>
          <strong>复盘建议</strong>
          <p>{{ day.reviewAdvice }}</p>
        </div>

        <div class="plan-status-actions">
          <span>计划状态</span>
          <n-button-group>
            <n-button
              v-for="status in statusOptions"
              :key="status"
              size="small"
              :type="day.status === status ? 'primary' : 'default'"
              :secondary="day.status !== status"
              @click="updateDayStatus(day.id, status)"
            >
              {{ statusLabels[status] }}
            </n-button>
          </n-button-group>
        </div>
      </n-card>
    </section>
  </div>
</template>

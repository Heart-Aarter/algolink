<script setup lang="ts">
import { computed } from 'vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { TrainingPlanStatus } from '@/types/algolink'

const store = useAlgoLinkStore()

const statusLabels: Record<TrainingPlanStatus, string> = {
  'not-started': '未开始',
  doing: '进行中',
  done: '已完成',
}

const totalProblems = computed(() =>
  store.weeklyPlanDays.reduce((sum, day) => sum + day.problemCount, 0),
)
const activeDays = computed(
  () => store.weeklyPlanDays.filter((day) => day.status !== 'not-started').length,
)

function updateDayStatus(id: string, event: Event) {
  const status = (event.target as HTMLSelectElement).value as TrainingPlanStatus
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
          计划围绕 DP、数学、图论和搜索的 mock 分析结果生成，状态保存在 localStorage，刷新页面后仍会保留。
        </p>
      </div>
      <div class="plan-ring">
        <strong>{{ store.weeklyPlanCompletion }}%</strong>
        <span>完成</span>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card compact-stat">
        <span>训练天数</span>
        <strong>{{ store.weeklyPlanDays.length }}</strong>
        <p>固定 7 天专题安排</p>
      </article>
      <article class="stat-card compact-stat">
        <span>推荐题量</span>
        <strong>{{ totalProblems }}</strong>
        <p>按每日主题分配题目</p>
      </article>
      <article class="stat-card compact-stat">
        <span>已启动天数</span>
        <strong>{{ activeDays }}</strong>
        <p>进行中或已完成的计划</p>
      </article>
      <article class="stat-card compact-stat">
        <span>状态存储</span>
        <strong>localStorage</strong>
        <p>刷新后保持计划状态</p>
      </article>
    </section>

    <section class="weekly-plan-grid">
      <article v-for="day in store.weeklyPlanDays" :key="day.id" class="weekly-plan-card">
        <div class="metric-top">
          <div>
            <span class="eyebrow">{{ day.dayLabel }}</span>
            <h3>{{ day.theme }}</h3>
          </div>
          <span
            :class="{
              'sync-queued': day.status === 'not-started',
              'sync-warning': day.status === 'doing',
              'sync-synced': day.status === 'done',
            }"
          >
            {{ statusLabels[day.status] }}
          </span>
        </div>

        <div class="plan-meta">
          <span>{{ day.problemCount }} 题</span>
          <span v-for="tag in day.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <div>
          <strong>训练目标</strong>
          <p>{{ day.goal }}</p>
        </div>

        <div>
          <strong>复盘建议</strong>
          <p>{{ day.reviewAdvice }}</p>
        </div>

        <label>
          计划状态
          <select :value="day.status" @change="updateDayStatus(day.id, $event)">
            <option value="not-started">未开始</option>
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
        </label>
      </article>
    </section>
  </div>
</template>

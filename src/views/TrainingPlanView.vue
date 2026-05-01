<script setup lang="ts">
import { computed, reactive } from 'vue'
import {
  NButton,
  NButtonGroup,
  NCard,
  NDynamicTags,
  NInput,
  NInputNumber,
  NTag,
  useMessage,
} from 'naive-ui'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { TrainingPlanStatus } from '@/types/algolink'

const store = useAlgoLinkStore()
const message = useMessage()

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

const newPlan = reactive({
  dayLabel: '',
  theme: '',
  problemCount: 3,
  tags: [] as string[],
  goal: '',
  reviewAdvice: '',
})

const totalProblems = computed(() =>
  store.weeklyPlanDays.reduce((sum, day) => sum + day.problemCount, 0),
)
const activeDays = computed(
  () => store.weeklyPlanDays.filter((day) => day.status !== 'not-started').length,
)

function updateDayStatus(id: string, status: TrainingPlanStatus) {
  store.updateWeeklyPlanStatus(id, status)
  message.success(`训练计划状态已更新为：${statusLabels[status]}`)
}

function resetForm() {
  newPlan.dayLabel = ''
  newPlan.theme = ''
  newPlan.problemCount = 3
  newPlan.tags = []
  newPlan.goal = ''
  newPlan.reviewAdvice = ''
}

function addPlan() {
  if (!newPlan.dayLabel.trim() || !newPlan.theme.trim() || !newPlan.goal.trim()) {
    message.warning('请填写计划日期、主题和训练目标。')
    return
  }

  const created = store.addWeeklyPlanDay({
    dayLabel: newPlan.dayLabel.trim(),
    theme: newPlan.theme.trim(),
    problemCount: newPlan.problemCount,
    tags: newPlan.tags.map((tag) => tag.trim()).filter(Boolean),
    goal: newPlan.goal.trim(),
    reviewAdvice: newPlan.reviewAdvice.trim() || '完成后复盘错因、耗时和可复用模板。',
  })

  message.success(`已添加训练计划：${created.dayLabel}`)
  resetForm()
}
</script>

<template>
  <div class="page-stack">
    <section class="panel plan-overview">
      <div>
        <p class="eyebrow">Training Roadmap</p>
        <h2>训练计划完成度 {{ store.weeklyPlanCompletion }}%</h2>
        <p>
          计划内容优先保存到后端 SQLite，并同步保留本地缓存；可在默认 7 天计划基础上继续添加自定义训练日，并独立记录每一天的执行状态。
        </p>
      </div>
      <div class="plan-ring">
        <strong>{{ store.weeklyPlanCompletion }}%</strong>
        <span>完成度</span>
      </div>
    </section>

    <section class="stats-grid">
      <StatCard label="训练天数" :value="store.weeklyPlanDays.length" helper="默认计划 + 自定义计划" />
      <StatCard label="题目总量" :value="totalProblems" helper="所有计划题量汇总" />
      <StatCard label="已启动天数" :value="activeDays" helper="进行中或已完成的计划" />
      <StatCard label="存储方式" value="SQLite" helper="本地缓存用于刷新和离线兜底" />
    </section>

    <section class="panel custom-plan-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Custom Plan</p>
          <h2>添加训练计划</h2>
        </div>
        <n-button type="primary" @click="addPlan">添加计划</n-button>
      </div>

      <div class="custom-plan-grid">
        <label>
          日期/阶段
          <n-input v-model:value="newPlan.dayLabel" placeholder="例如 Day 8 / 图论专题" />
        </label>
        <label>
          训练主题
          <n-input v-model:value="newPlan.theme" placeholder="例如 最短路复盘" />
        </label>
        <label>
          题目数量
          <n-input-number v-model:value="newPlan.problemCount" :min="1" :max="20" />
        </label>
        <label>
          标签
          <n-dynamic-tags v-model:value="newPlan.tags" />
        </label>
        <label class="wide-field">
          训练目标
          <n-input
            v-model:value="newPlan.goal"
            type="textarea"
            placeholder="写清本阶段要解决的能力短板"
          />
        </label>
        <label class="wide-field">
          复盘建议
          <n-input
            v-model:value="newPlan.reviewAdvice"
            type="textarea"
            placeholder="可选，留空则使用默认复盘建议"
          />
        </label>
      </div>
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

<style scoped>
.custom-plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.custom-plan-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 700;
}

.wide-field {
  grid-column: 1 / -1;
}

@media (max-width: 760px) {
  .custom-plan-grid {
    grid-template-columns: 1fr;
  }
}
</style>

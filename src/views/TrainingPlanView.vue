<script setup lang="ts">
import { computed } from 'vue'
import { contestMilestones } from '@/mock/algolink'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { TrainingTask } from '@/types/algolink'

const store = useAlgoLinkStore()
const columns: Array<{ status: TrainingTask['status']; label: string; helper: string }> = [
  { status: 'todo', label: '待训练', helper: '准备进入训练队列' },
  { status: 'doing', label: '进行中', helper: '本周主线任务' },
  { status: 'done', label: '已完成', helper: '已复盘或已通过' },
]

const completion = computed(() => {
  const done = store.trainingTasks.filter((task) => task.status === 'done').length
  return Math.round((done / Math.max(store.trainingTasks.length, 1)) * 100)
})
</script>

<template>
  <div class="page-stack">
    <section class="panel plan-overview">
      <div>
        <p class="eyebrow">Training Roadmap</p>
        <h2>本周训练完成度 {{ completion }}%</h2>
        <p>训练计划围绕 AI 识别出的能力缺口生成，支持在本地调整任务状态。</p>
      </div>
      <div class="plan-ring">
        <strong>{{ completion }}%</strong>
        <span>完成</span>
      </div>
    </section>

    <section class="plan-board">
      <div v-for="column in columns" :key="column.status" class="plan-column">
        <div class="column-head">
          <h2>{{ column.label }}</h2>
          <span>{{ column.helper }}</span>
        </div>
        <article
          v-for="task in store.trainingTasks.filter((item) => item.status === column.status)"
          :key="task.id"
          class="task-card"
        >
          <span>{{ task.platform }} · {{ task.difficulty }} · 截止 {{ task.dueDate || '待定' }}</span>
          <h3>{{ task.title }}</h3>
          <p>{{ task.focus }}</p>
          <div class="meter"><i :style="{ width: `${task.progress ?? 0}%` }" /></div>
          <select
            :value="task.status"
            @change="
              store.updateTaskStatus(
                task.id,
                ($event.target as HTMLSelectElement).value as TrainingTask['status'],
              )
            "
          >
            <option value="todo">待训练</option>
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>近期训练节点</h2>
      </div>
      <div class="timeline-list">
        <article v-for="item in contestMilestones" :key="`${item.date}-${item.title}`" class="timeline-item">
          <time>{{ item.date }}</time>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.platform }} · {{ item.goal }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

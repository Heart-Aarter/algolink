<script setup lang="ts">
import { useAlgoLinkStore } from '@/stores/algolink'
import type { TrainingTask } from '@/types/algolink'

const store = useAlgoLinkStore()
const columns: Array<{ status: TrainingTask['status']; label: string }> = [
  { status: 'todo', label: '待训练' },
  { status: 'doing', label: '进行中' },
  { status: 'done', label: '已完成' },
]
</script>

<template>
  <div class="page-stack">
    <section class="plan-board">
      <div v-for="column in columns" :key="column.status" class="plan-column">
        <h2>{{ column.label }}</h2>
        <article
          v-for="task in store.trainingTasks.filter((item) => item.status === column.status)"
          :key="task.id"
          class="task-card"
        >
          <span>{{ task.platform }} · {{ task.difficulty }}</span>
          <h3>{{ task.title }}</h3>
          <p>{{ task.focus }}</p>
          <select
            :value="task.status"
            @change="
              store.updateTaskStatus(task.id, ($event.target as HTMLSelectElement).value as TrainingTask['status'])
            "
          >
            <option value="todo">待训练</option>
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
        </article>
      </div>
    </section>
  </div>
</template>

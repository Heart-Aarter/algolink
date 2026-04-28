<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform, SubmissionStatus } from '@/types/algolink'

const store = useAlgoLinkStore()
const platformFilter = ref<'All' | OjPlatform>('All')
const statusFilter = ref<'All' | SubmissionStatus>('All')

const platforms: Array<'All' | OjPlatform> = ['All', 'Codeforces', 'Luogu', 'AtCoder']
const statuses: Array<'All' | SubmissionStatus> = [
  'All',
  'Accepted',
  'Wrong Answer',
  'Time Limit',
  'Runtime Error',
]

const filteredSubmissions = computed(() =>
  store.submissions.filter((item) => {
    const matchedPlatform = platformFilter.value === 'All' || item.platform === platformFilter.value
    const matchedStatus = statusFilter.value === 'All' || item.status === statusFilter.value
    return matchedPlatform && matchedStatus
  }),
)
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Submission Stream</p>
          <h2>提交记录</h2>
        </div>
        <div class="filter-bar">
          <select v-model="platformFilter">
            <option v-for="item in platforms" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="statusFilter">
            <option v-for="item in statuses" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>平台</th>
              <th>题目</th>
              <th>难度</th>
              <th>标签</th>
              <th>结果</th>
              <th>语言</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="submission in filteredSubmissions" :key="submission.id">
              <td>{{ submission.platform }}</td>
              <td>{{ submission.problem }}</td>
              <td>{{ submission.difficulty }}</td>
              <td>
                <span v-for="tag in submission.tags" :key="tag" class="tag">{{ tag }}</span>
              </td>
              <td>
                <span class="status-pill" :class="submission.status.toLowerCase().replaceAll(' ', '-')">
                  {{ submission.status }}
                </span>
              </td>
              <td>{{ submission.language }}</td>
              <td>{{ submission.submittedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform, SubmissionStatus } from '@/types/algolink'

const store = useAlgoLinkStore()
const keyword = ref('')
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
    const matchedKeyword =
      !keyword.value.trim() ||
      `${item.problem} ${item.tags.join(' ')} ${item.platform}`
        .toLowerCase()
        .includes(keyword.value.trim().toLowerCase())
    const matchedPlatform = platformFilter.value === 'All' || item.platform === platformFilter.value
    const matchedStatus = statusFilter.value === 'All' || item.status === statusFilter.value
    return matchedKeyword && matchedPlatform && matchedStatus
  }),
)

const accepted = computed(
  () => filteredSubmissions.value.filter((item) => item.status === 'Accepted').length,
)
</script>

<template>
  <div class="page-stack">
    <section class="stats-grid submission-stats">
      <StatCard label="筛选结果" :value="filteredSubmissions.length" helper="当前表格记录数" />
      <StatCard label="Accepted" :value="accepted" helper="筛选范围内通过数" />
      <StatCard
        label="失败提交"
        :value="filteredSubmissions.length - accepted"
        helper="需要复盘的记录"
      />
      <StatCard label="平台数" :value="store.accounts.length" helper="已绑定公开账号" />
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Submission Stream</p>
          <h2>提交记录</h2>
        </div>
        <div class="filter-bar">
          <input v-model="keyword" type="search" placeholder="搜索题目、标签或平台" />
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
              <th>运行</th>
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
              <td>{{ submission.runtime }}</td>
              <td>{{ submission.submittedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform, SubmissionStatus } from '@/types/algolink'

const store = useAlgoLinkStore()
const keyword = ref('')
const platformFilter = ref<'All' | OjPlatform>('All')
const statusFilter = ref<'All' | SubmissionStatus>('All')

const platforms = computed<Array<'All' | OjPlatform>>(() => ['All', ...store.supportedPlatforms])
const statuses: Array<'All' | SubmissionStatus> = [
  'All',
  'Accepted',
  'Wrong Answer',
  'Time Limit',
  'Runtime Error',
]

const filteredSubmissions = computed(() =>
  store.boundSubmissions.filter((item) => {
    const query = keyword.value.trim().toLowerCase()
    const matchedKeyword =
      !query ||
      `${item.problem} ${item.tags.join(' ')} ${item.platform}`.toLowerCase().includes(query)
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
      <StatCard label="当前记录" :value="filteredSubmissions.length" helper="按已绑定平台展示 mock 提交" />
      <StatCard label="Accepted" :value="accepted" helper="筛选结果中的通过记录" />
      <StatCard
        label="未通过"
        :value="filteredSubmissions.length - accepted"
        helper="WA / TLE / RE 记录"
      />
      <StatCard label="绑定平台" :value="store.accounts.length" helper="来自 localStorage 的公开账号" />
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

      <div v-if="store.accounts.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>平台</th>
              <th>题目</th>
              <th>难度</th>
              <th>标签</th>
              <th>结果</th>
              <th>语言</th>
              <th>运行时间</th>
              <th>提交时间</th>
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
            <tr v-if="!filteredSubmissions.length">
              <td colspan="8">当前筛选条件下没有 mock 提交记录。</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>暂无提交记录</h3>
        <p>请先绑定至少一个 OJ 公开账号，页面会按绑定平台展示对应的 mock 提交记录。</p>
        <RouterLink class="text-link" to="/accounts">去绑定账号</RouterLink>
      </div>
    </section>
  </div>
</template>

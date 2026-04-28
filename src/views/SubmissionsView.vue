<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import { calculateSubmissionAnalysis, difficultyBucketOptions } from '@/utils/analysis'
import {
  extractSubmissionTags,
  filterSubmissions,
  sortOptions,
  type SubmissionFilterState,
} from '@/utils/submissionFilters'
import { getStatusClass, getVerdictCode, verdictOptions } from '@/utils/verdict'

const store = useAlgoLinkStore()

const filters = reactive<SubmissionFilterState>({
  keyword: '',
  platform: 'All',
  verdict: 'All',
  tag: 'All',
  difficulty: 'All',
  sort: 'time-desc',
})

const sourceSubmissions = computed(() => store.submissions)
const tagOptions = computed(() => ['All', ...extractSubmissionTags(sourceSubmissions.value)])
const platformOptions = computed(() => ['All', ...store.supportedPlatforms] as const)
const filteredSubmissions = computed(() => filterSubmissions(sourceSubmissions.value, filters))
const filteredAnalysis = computed(() => calculateSubmissionAnalysis(filteredSubmissions.value))
const pageSizeOptions = [20, 30, 50]
const currentPage = ref(1)
const pageSize = ref(20)
const cappedPageSize = computed(() => Math.min(Math.max(pageSize.value, 1), 50))
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSubmissions.value.length / cappedPageSize.value)),
)
const pageStart = computed(() =>
  filteredSubmissions.value.length ? (currentPage.value - 1) * cappedPageSize.value : 0,
)
const pageEnd = computed(() =>
  Math.min(pageStart.value + cappedPageSize.value, filteredSubmissions.value.length),
)
const paginatedSubmissions = computed(() =>
  filteredSubmissions.value.slice(pageStart.value, pageEnd.value),
)

watch(
  () => [
    filters.keyword,
    filters.platform,
    filters.verdict,
    filters.tag,
    filters.difficulty,
    filters.sort,
  ],
  () => {
    currentPage.value = 1
  },
)

watch(pageSize, (size) => {
  pageSize.value = Math.min(Math.max(size, 1), 50)
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  currentPage.value = Math.min(currentPage.value, pages)
})

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}
</script>

<template>
  <div class="page-stack">
    <section class="stats-grid submission-stats">
      <StatCard
        label="筛选结果"
        :value="filteredSubmissions.length"
        helper="当前条件下的提交记录"
      />
      <StatCard label="AC" :value="filteredAnalysis.accepted" helper="筛选结果中的通过提交" />
      <StatCard
        label="已解决"
        :value="filteredAnalysis.solvedProblems"
        helper="按题目去重后的 AC 数"
      />
      <StatCard
        label="30 天提交"
        :value="filteredAnalysis.recent30Total"
        helper="最近 30 天训练活跃度"
      />
    </section>

    <section class="panel">
      <div class="panel-heading submissions-heading">
        <div>
          <p class="eyebrow">Submission Stream</p>
          <h2>提交记录</h2>
        </div>
        <div class="filter-bar submission-filter-bar">
          <input v-model="filters.keyword" type="search" placeholder="搜索题目、题号、标签、语言" />
          <select v-model="filters.platform" aria-label="Platform filter">
            <option v-for="item in platformOptions" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="filters.verdict" aria-label="Verdict filter">
            <option v-for="item in verdictOptions" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="filters.tag" aria-label="Tag filter">
            <option v-for="item in tagOptions" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="filters.difficulty" aria-label="Difficulty filter">
            <option v-for="item in difficultyBucketOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <select v-model="filters.sort" aria-label="Sort submissions">
            <option v-for="item in sortOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="filteredSubmissions.length" class="pagination-bar">
        <div class="pagination-summary">
          显示 {{ pageStart + 1 }}-{{ pageEnd }} / {{ filteredSubmissions.length }} 条
        </div>
        <div class="pagination-actions">
          <label class="page-size-control">
            每页
            <select v-model.number="pageSize" aria-label="Rows per page">
              <option v-for="item in pageSizeOptions" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>
          <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            上一页
          </button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>

      <div v-if="filteredSubmissions.length" class="table-wrap">
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
            <tr v-for="submission in paginatedSubmissions" :key="submission.id">
              <td>{{ submission.platform }}</td>
              <td>{{ submission.problem }}</td>
              <td>{{ submission.difficulty }}</td>
              <td>
                <span v-for="tag in submission.tags" :key="tag" class="tag">{{ tag }}</span>
                <span v-if="!submission.tags.length" class="tag">untagged</span>
              </td>
              <td>
                <span class="status-pill" :class="getStatusClass(submission.status)">
                  {{ getVerdictCode(submission.status) }}
                </span>
              </td>
              <td>{{ submission.language }}</td>
              <td>{{ submission.runtime }}</td>
              <td>{{ submission.submittedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state submission-empty">
        <h3>没有符合条件的提交记录</h3>
        <p>可以清空关键词、将结果或标签切回 All，或放宽难度区间。</p>
      </div>
    </section>
  </div>
</template>

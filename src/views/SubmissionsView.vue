<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import {
  NDataTable,
  NEmpty,
  NInput,
  NPagination,
  NSelect,
  NTag,
  type DataTableColumns,
} from 'naive-ui'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import { calculateSubmissionAnalysis, difficultyBucketOptions } from '@/utils/analysis'
import {
  extractSubmissionTags,
  filterSubmissions,
  sortOptions,
  type SubmissionFilterState,
} from '@/utils/submissionFilters'
import { getDisplayTags } from '@/utils/tags'
import { getVerdictCode, verdictOptions } from '@/utils/verdict'
import type { SubmissionRecord, SubmissionStatus } from '@/types/algolink'

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
const activeFilterCount = computed(
  () =>
    Number(Boolean(filters.keyword.trim())) +
    [filters.platform, filters.verdict, filters.tag, filters.difficulty].filter(
      (item) => item !== 'All',
    ).length,
)

const platformSelectOptions = computed(() =>
  platformOptions.value.map((item) => ({
    label: item,
    value: item,
  })),
)
const verdictSelectOptions = computed(() =>
  verdictOptions.map((item) => ({
    label: item,
    value: item,
  })),
)
const tagSelectOptions = computed(() =>
  tagOptions.value.map((item) => ({
    label: item,
    value: item,
  })),
)
const difficultySelectOptions = difficultyBucketOptions.map((item) => ({
  label: item.label,
  value: item.value,
}))
const sortSelectOptions = sortOptions.map((item) => ({
  label: item.label,
  value: item.value,
}))

const columns: DataTableColumns<SubmissionRecord> = [
  {
    title: '平台',
    key: 'platform',
    width: 118,
    render(row) {
      return h(
        'span',
        { class: ['submission-platform', `platform-${row.platform.toLowerCase()}`] },
        row.platform,
      )
    },
  },
  {
    title: '题目',
    key: 'problem',
    minWidth: 260,
    render(row) {
      return h('div', { class: 'submission-problem' }, [
        h('strong', row.problem),
        h('span', row.problemId || 'Untracked'),
      ])
    },
  },
  {
    title: '难度',
    key: 'difficulty',
    width: 104,
    render(row) {
      return h('span', { class: 'difficulty-chip' }, row.difficulty)
    },
  },
  {
    title: '标签',
    key: 'tags',
    minWidth: 220,
    render(row) {
      const tags = getDisplayTags(row)
      return h(
        'div',
        { class: 'submission-tags' },
        tags.map((tag) =>
          h(NTag, { size: 'small', round: true, bordered: false }, { default: () => tag }),
        ),
      )
    },
  },
  {
    title: '结果',
    key: 'status',
    width: 110,
    render(row) {
      return h(
        NTag,
        { type: getStatusTagType(row.status), size: 'small', round: true },
        { default: () => getVerdictCode(row.status) },
      )
    },
  },
  { title: '语言', key: 'language', width: 140 },
  {
    title: '运行时间',
    key: 'runtime',
    width: 112,
    render(row) {
      return h('span', { class: 'runtime-cell' }, row.runtime || '-')
    },
  },
  { title: '提交时间', key: 'submittedAt', width: 156 },
]

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

function getStatusTagType(status: SubmissionStatus) {
  if (status === 'Accepted') {
    return 'success'
  }

  if (status === 'Wrong Answer' || status === 'Runtime Error' || status === 'Compilation Error') {
    return 'error'
  }

  if (status === 'Time Limit') {
    return 'warning'
  }

  return 'default'
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
          <span class="mobile-filter-count">{{ activeFilterCount }} 个筛选</span>
          <h2>提交记录</h2>
        </div>
      </div>

      <div class="filter-bar submission-filter-bar naive-filter-bar">
        <n-input
          v-model:value="filters.keyword"
          clearable
          placeholder="搜索题目、题号、标签、语言"
        />
        <n-select v-model:value="filters.platform" :options="platformSelectOptions" />
        <n-select v-model:value="filters.verdict" :options="verdictSelectOptions" />
        <n-select v-model:value="filters.tag" :options="tagSelectOptions" />
        <n-select v-model:value="filters.difficulty" :options="difficultySelectOptions" />
        <n-select v-model:value="filters.sort" :options="sortSelectOptions" />
      </div>

      <div v-if="filteredSubmissions.length" class="pagination-bar naive-pagination-bar">
        <div class="pagination-summary">
          显示 {{ pageStart + 1 }}-{{ pageEnd }} / {{ filteredSubmissions.length }} 条
        </div>
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :item-count="filteredSubmissions.length"
          :page-sizes="pageSizeOptions"
          show-size-picker
        />
      </div>

      <n-data-table
        v-if="filteredSubmissions.length"
        :columns="columns"
        :data="paginatedSubmissions"
        :bordered="false"
        :single-line="false"
        size="small"
        class="submission-data-table"
      />

      <div v-if="filteredSubmissions.length" class="mobile-submission-list mobile-submission-stream">
        <article
          v-for="submission in paginatedSubmissions"
          :key="submission.id"
          class="mobile-submission-card"
        >
          <div class="mobile-submission-main">
            <span>{{ submission.platform }}</span>
            <strong>{{ submission.problem }}</strong>
            <small>{{ submission.problemId || submission.submittedAt }}</small>
          </div>
          <div class="mobile-submission-meta">
            <n-tag size="small" round :type="getStatusTagType(submission.status)">
              {{ getVerdictCode(submission.status) }}
            </n-tag>
            <span>{{ submission.difficulty }}</span>
          </div>
          <div class="mobile-submission-tags">
            <n-tag
              v-for="tag in getDisplayTags(submission).slice(0, 4)"
              :key="tag"
              size="small"
              round
              :bordered="false"
            >
              {{ tag }}
            </n-tag>
          </div>
          <footer>
            <span>{{ submission.language }}</span>
            <span>{{ submission.runtime || '-' }}</span>
            <span>{{ submission.submittedAt }}</span>
          </footer>
        </article>
      </div>

      <n-empty v-else description="没有符合条件的提交记录" class="empty-state naive-empty">
        <template #extra>
          <span>可以清空关键词，将结果或标签切回 All，或放宽难度区间。</span>
        </template>
      </n-empty>
    </section>
  </div>
</template>

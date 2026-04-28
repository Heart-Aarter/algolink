<script setup lang="ts">
import { computed, ref } from 'vue'
import { recommendedProblems } from '@/mock/recommendedProblems'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import { useAlgoLinkStore } from '@/stores/algolink'
import { getTagAnalysis, getTrainingSummary } from '@/utils/analysis'

const store = useAlgoLinkStore()
const activeMode = ref<'rules' | 'weak-tags' | 'weekly-plan' | 'recommendations'>('rules')

const analysisSubmissions = computed(() =>
  store.codeforcesSubmissions.length ? store.codeforcesSubmissions : store.submissions,
)
const summary = computed(() => getTrainingSummary(analysisSubmissions.value))
const weakTagDetails = computed(() => getTagAnalysis(analysisSubmissions.value).slice(0, 5))
const dataSourceLabel = computed(() =>
  store.codeforcesSubmissions.length ? '真实 Codeforces 数据' : 'mock 兜底数据',
)

const weeklyPlanSummary = computed(() => ({
  days: weeklyTrainingPlan.length,
  problems: weeklyTrainingPlan.reduce((sum, day) => sum + day.problemCount, 0),
  focusTags: [...new Set(weeklyTrainingPlan.flatMap((day) => day.tags))].slice(0, 8),
}))

const modeTitle = computed(() => {
  if (activeMode.value === 'rules') {
    return '规则化训练建议'
  }
  if (activeMode.value === 'weak-tags') {
    return '薄弱标签诊断'
  }
  if (activeMode.value === 'weekly-plan') {
    return '训练计划联动'
  }
  return '题目推荐'
})
</script>

<template>
  <div class="page-stack">
    <section class="panel ai-brief">
      <p class="eyebrow">AI Coach Mock</p>
      <h2>联动能力画像的训练建议</h2>
      <p>
        {{ summary.headline }} {{ summary.focus }} {{ summary.suggestion }}
      </p>
      <div class="coach-summary-grid">
        <div>
          <span>数据来源</span>
          <strong>{{ dataSourceLabel }}</strong>
        </div>
        <div>
          <span>AC 率</span>
          <strong>{{ summary.acceptanceRate }}%</strong>
        </div>
        <div>
          <span>薄弱标签</span>
          <strong>{{ summary.weakTags.join(' / ') || '-' }}</strong>
        </div>
      </div>
    </section>

    <section class="coach-actions">
      <button type="button" :class="{ active: activeMode === 'rules' }" @click="activeMode = 'rules'">
        规则建议
      </button>
      <button
        type="button"
        :class="{ active: activeMode === 'weak-tags' }"
        @click="activeMode = 'weak-tags'"
      >
        薄弱标签
      </button>
      <button
        type="button"
        :class="{ active: activeMode === 'weekly-plan' }"
        @click="activeMode = 'weekly-plan'"
      >
        训练计划
      </button>
      <button
        type="button"
        :class="{ active: activeMode === 'recommendations' }"
        @click="activeMode = 'recommendations'"
      >
        题目推荐
      </button>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Mock Result</p>
          <h2>{{ modeTitle }}</h2>
        </div>
        <RouterLink v-if="activeMode === 'weekly-plan'" class="text-link" to="/training-plan">
          打开训练计划
        </RouterLink>
      </div>

      <div v-if="activeMode === 'rules'" class="analysis-list">
        <article v-for="item in summary.suggestions" :key="item" class="analysis-card">
          <div class="metric-top">
            <h3>建议规则</h3>
            <span class="trend-up">Mock</span>
          </div>
          <p>{{ item }}</p>
          <strong>由本地提交统计生成，不调用真实 AI API。</strong>
        </article>
      </div>

      <div v-else-if="activeMode === 'weak-tags'" class="analysis-list">
        <article v-for="item in weakTagDetails" :key="item.tag" class="analysis-card">
          <div class="metric-top">
            <h3>{{ item.tag }}</h3>
            <span :class="item.acceptanceRate >= 70 ? 'trend-up' : 'trend-down'">
              {{ item.acceptanceRate }}%
            </span>
          </div>
          <p>共 {{ item.total }} 次提交，AC {{ item.accepted }} 次，非 AC {{ item.failed }} 次。</p>
          <strong>
            {{
              item.failed
                ? '建议复盘失败提交，先写清不变量或状态转移，再选择相近难度重做。'
                : '该标签在当前样本中较稳定，保持低频维护即可。'
            }}
          </strong>
        </article>
      </div>

      <div v-else-if="activeMode === 'weekly-plan'" class="plan-summary-grid">
        <article class="policy-card">
          <strong>计划周期</strong>
          <p>{{ weeklyPlanSummary.days }} 天训练，包含专题推进和复盘窗口。</p>
        </article>
        <article class="policy-card">
          <strong>题量安排</strong>
          <p>{{ weeklyPlanSummary.problems }} 道计划题，会根据薄弱标签和近期活跃度调整。</p>
        </article>
        <article class="policy-card">
          <strong>重点标签</strong>
          <p>{{ weeklyPlanSummary.focusTags.join(' / ') }}</p>
        </article>
      </div>

      <div v-else class="recommend-list">
        <article v-for="problem in recommendedProblems" :key="problem.id" class="recommend-card">
          <div>
            <span class="platform-chip">{{ problem.platform }}</span>
            <strong>{{ problem.title }}</strong>
            <p>{{ problem.difficulty }} / {{ problem.reason }}</p>
          </div>
          <div>
            <span v-for="tag in problem.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { recommendedProblems } from '@/mock/recommendedProblems'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import { useAlgoLinkStore } from '@/stores/algolink'
import { getTagAnalysis, getTrainingSummary } from '@/utils/analysis'

const store = useAlgoLinkStore()
const activeMode = ref<'weak-tags' | 'weekly-plan' | 'recommendations'>('weak-tags')

const analysisSubmissions = computed(() =>
  store.boundSubmissions.length ? store.boundSubmissions : store.submissions,
)
const summary = computed(() => getTrainingSummary(analysisSubmissions.value))
const weakTagDetails = computed(() => getTagAnalysis(analysisSubmissions.value).slice(0, 5))

const weeklyPlanSummary = computed(() => ({
  days: weeklyTrainingPlan.length,
  problems: weeklyTrainingPlan.reduce((sum, day) => sum + day.problemCount, 0),
  focusTags: [...new Set(weeklyTrainingPlan.flatMap((day) => day.tags))].slice(0, 8),
}))

const modeTitle = computed(() => {
  if (activeMode.value === 'weak-tags') {
    return '薄弱标签分析'
  }
  if (activeMode.value === 'weekly-plan') {
    return '本周训练计划摘要'
  }
  return '推荐下一组题目'
})
</script>

<template>
  <div class="page-stack">
    <section class="panel ai-brief">
      <p class="eyebrow">AI Coach Mock</p>
      <h2>AI 训练建议</h2>
      <p>
        {{ summary.headline }}；{{ summary.focus }}。{{ summary.suggestion }}
      </p>
      <div class="coach-summary-grid">
        <div>
          <span>样本提交</span>
          <strong>{{ summary.total }}</strong>
        </div>
        <div>
          <span>通过率</span>
          <strong>{{ summary.acceptanceRate }}%</strong>
        </div>
        <div>
          <span>薄弱标签</span>
          <strong>{{ summary.weakTags.join(' / ') || '暂无' }}</strong>
        </div>
      </div>
    </section>

    <section class="coach-actions">
      <button
        type="button"
        :class="{ active: activeMode === 'weak-tags' }"
        @click="activeMode = 'weak-tags'"
      >
        分析薄弱标签
      </button>
      <button
        type="button"
        :class="{ active: activeMode === 'weekly-plan' }"
        @click="activeMode = 'weekly-plan'"
      >
        生成本周训练计划
      </button>
      <button
        type="button"
        :class="{ active: activeMode === 'recommendations' }"
        @click="activeMode = 'recommendations'"
      >
        推荐下一组题目
      </button>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Mock Result</p>
          <h2>{{ modeTitle }}</h2>
        </div>
        <RouterLink v-if="activeMode === 'weekly-plan'" class="text-link" to="/training-plan">
          进入训练计划
        </RouterLink>
      </div>

      <div v-if="activeMode === 'weak-tags'" class="analysis-list">
        <article v-for="item in weakTagDetails" :key="item.tag" class="analysis-card">
          <div class="metric-top">
            <h3>{{ item.tag }}</h3>
            <span :class="item.acceptanceRate >= 70 ? 'trend-up' : 'trend-down'">
              {{ item.acceptanceRate }}%
            </span>
          </div>
          <p>
            共 {{ item.total }} 次提交，AC {{ item.accepted }} 次，未通过 {{ item.failed }} 次。
          </p>
          <strong>
            {{
              item.failed
                ? '建议先复盘错误用例，再补同标签中低难度题巩固模型。'
                : '当前表现稳定，可作为每日热身标签。'
            }}
          </strong>
        </article>
      </div>

      <div v-else-if="activeMode === 'weekly-plan'" class="plan-summary-grid">
        <article class="policy-card">
          <strong>训练周期</strong>
          <p>{{ weeklyPlanSummary.days }} 天专题训练，每天聚焦一个主问题，避免题目过散。</p>
        </article>
        <article class="policy-card">
          <strong>推荐题量</strong>
          <p>本周合计 {{ weeklyPlanSummary.problems }} 题，前 5 天专项补弱，后 2 天综合复盘。</p>
        </article>
        <article class="policy-card">
          <strong>覆盖标签</strong>
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

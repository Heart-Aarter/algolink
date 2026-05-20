<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NSpin, NTag } from 'naive-ui'
import { useMockAsync } from '@/composables/useMockAsync'
import { recommendedProblems } from '@/mock/recommendedProblems'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { UserSettings } from '@/types/algolink'
import { getTagAnalysis, getTrainingSummary } from '@/utils/analysis'

const store = useAlgoLinkStore()
const activeMode = ref<'rules' | 'weak-tags' | 'weekly-plan' | 'recommendations'>('rules')
const { isGenerating, start } = useMockAsync(650)
function generateAdvice() {
  start()
}

const summary = computed(() =>
  getTrainingSummary(store.analysisSubmissions, store.settings.aiTone),
)
const weakTagDetails = computed(() => getTagAnalysis(store.analysisSubmissions).slice(0, 5))

const toneCopy: Record<
  UserSettings['aiTone'],
  { badge: string; tagType: 'error' | 'info' | 'success'; prefix: string }
> = {
  strict: {
    badge: 'Strict',
    tagType: 'error',
    prefix: '严格模式：直接处理最高风险项，',
  },
  balanced: {
    badge: 'Balanced',
    tagType: 'info',
    prefix: '均衡模式：兼顾补弱和稳定节奏，',
  },
  encouraging: {
    badge: 'Encouraging',
    tagType: 'success',
    prefix: '鼓励模式：保持当前进步，同时',
  },
}

const activeTone = computed(() => toneCopy[store.settings.aiTone])
const tonedSummary = computed(() => ({
  ...summary.value,
  headline: `${activeTone.value.prefix}${summary.value.headline}`,
  suggestion: `${activeTone.value.prefix}${summary.value.suggestion}`,
  suggestions: summary.value.suggestions.map((item) => `${activeTone.value.prefix}${item}`),
}))

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
      <p>{{ tonedSummary.headline }} {{ tonedSummary.focus }} {{ tonedSummary.suggestion }}</p>
      <div class="coach-summary-grid">
        <div>
          <span>数据来源</span>
          <strong>{{ store.submissionDataSourceLabel }}</strong>
        </div>
        <div>
          <span>AC 率</span>
          <strong>{{ tonedSummary.acceptanceRate }}%</strong>
        </div>
        <div>
          <span>薄弱标签</span>
          <strong>{{ tonedSummary.weakTags.join(' / ') || '-' }}</strong>
        </div>
      </div>
    </section>

    <section class="coach-actions">
      <n-button
        :type="activeMode === 'rules' ? 'primary' : 'default'"
        :secondary="activeMode !== 'rules'"
        @click="activeMode = 'rules'"
      >
        规则建议
      </n-button>
      <n-button
        :type="activeMode === 'weak-tags' ? 'primary' : 'default'"
        :secondary="activeMode !== 'weak-tags'"
        @click="activeMode = 'weak-tags'"
      >
        薄弱标签
      </n-button>
      <n-button
        :type="activeMode === 'weekly-plan' ? 'primary' : 'default'"
        :secondary="activeMode !== 'weekly-plan'"
        @click="activeMode = 'weekly-plan'"
      >
        训练计划
      </n-button>
      <n-button
        :type="activeMode === 'recommendations' ? 'primary' : 'default'"
        :secondary="activeMode !== 'recommendations'"
        @click="activeMode = 'recommendations'"
      >
        题目推荐
      </n-button>
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
        <n-button v-else type="primary" secondary :loading="isGenerating" @click="generateAdvice">
          生成建议
        </n-button>
      </div>

      <n-spin :show="isGenerating">
        <Transition name="tab-fade" mode="out-in">
          <div v-if="activeMode === 'rules'" :key="activeMode" class="analysis-list">
            <article v-for="item in tonedSummary.suggestions" :key="item" class="analysis-card">
              <div class="metric-top">
                <h3>建议规则</h3>
                <n-tag :type="activeTone.tagType" size="small" round>
                  {{ activeTone.badge }}
                </n-tag>
              </div>
              <p>{{ item }}</p>
              <strong>由本地提交统计生成，不调用真实 AI API。</strong>
            </article>
          </div>

          <div v-else-if="activeMode === 'weak-tags'" :key="activeMode" class="analysis-list">
            <article v-for="item in weakTagDetails" :key="item.tag" class="analysis-card">
              <div class="metric-top">
                <h3>{{ item.tag }}</h3>
                <n-tag :type="item.acceptanceRate >= 70 ? 'success' : 'error'" size="small" round>
                  {{ item.acceptanceRate }}%
                </n-tag>
              </div>
              <p>
                共 {{ item.total }} 次提交，AC {{ item.accepted }} 次，非 AC {{ item.failed }} 次。
              </p>
              <strong>
                {{
                  item.failed
                    ? '建议复盘失败提交，先写清不变量或状态转移，再选择相近难度重做。'
                    : '该标签在当前样本中较稳定，保持低频维护即可。'
                }}
              </strong>
            </article>
          </div>

          <div v-else-if="activeMode === 'weekly-plan'" :key="activeMode" class="plan-summary-grid">
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

          <div v-else :key="activeMode" class="recommend-list">
            <article
              v-for="problem in recommendedProblems"
              :key="problem.id"
              class="recommend-card"
            >
              <div>
                <n-tag type="info" size="small" round>{{ problem.platform }}</n-tag>
                <strong>{{ problem.title }}</strong>
                <p>{{ problem.difficulty }} / {{ problem.reason }}</p>
              </div>
              <div class="submission-tags">
                <n-tag v-for="tag in problem.tags" :key="tag" size="small" round>{{ tag }}</n-tag>
              </div>
            </article>
          </div>
        </Transition>
      </n-spin>
    </section>
  </div>
</template>

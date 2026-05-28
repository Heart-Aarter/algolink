<script setup lang="ts">
import { computed, ref } from 'vue'
import { NAlert, NButton, NSpin, NTag, useMessage } from 'naive-ui'
import { problemRecommendations as recommendedProblems } from '@/mock/algolink'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import { generateAiAdvice } from '@/services/api'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { UserSettings } from '@/types/algolink'
import {
  calculateSubmissionAnalysis,
  getTagAnalysis,
  getTrainingSummary,
  parseSubmittedAt,
} from '@/utils/analysis'

const store = useAlgoLinkStore()
const message = useMessage()
const activeMode = ref<'rules' | 'weak-tags' | 'weekly-plan' | 'recommendations'>('rules')
const isGenerating = ref(false)
const aiError = ref('')
const aiStatusMessage = ref('')
const aiStatusType = ref<'success' | 'info'>('info')

function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const summary = computed(() =>
  getTrainingSummary(store.analysisSubmissions, store.settings.aiTone),
)
const weakTagDetails = computed(() => getTagAnalysis(store.analysisSubmissions).slice(0, 5))
const isAiConfigured = computed(
  () => {
    if (!store.settings.aiEnabled || !store.hasAiApiKey) {
      return false
    }

    if (store.settings.aiProvider === 'deepseek') {
      return true
    }

    return Boolean(store.settings.aiBaseUrl.trim()) && Boolean(store.settings.aiModel.trim())
  },
)

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

const heroSummary = computed(() => {
  if (store.aiAdvice) {
    return `${store.aiAdvice.headline} ${store.aiAdvice.summary}`
  }

  return `${tonedSummary.value.headline} ${tonedSummary.value.focus} ${tonedSummary.value.suggestion}`
})

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

const generationLabel = computed(() =>
  isAiConfigured.value ? '生成真实 AI 建议' : '生成规则建议',
)

const severityType = {
  high: 'error',
  medium: 'warning',
  low: 'info',
} as const

const deepSeekDefaults = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
}

function getRecentSubmissionSample() {
  return [...store.analysisSubmissions]
    .sort((left, right) => {
      const leftTime = parseSubmittedAt(left.submittedAt)?.getTime() ?? 0
      const rightTime = parseSubmittedAt(right.submittedAt)?.getTime() ?? 0
      return rightTime - leftTime
    })
    .slice(0, 16)
    .map((item) => ({
      platform: item.platform,
      problem: item.problem,
      difficulty: item.difficulty,
      tags: item.tags,
      status: item.status,
      language: item.language,
      submittedAt: item.submittedAt,
    }))
}

async function generateAdvice() {
  activeMode.value = 'rules'
  aiError.value = ''
  aiStatusMessage.value = ''

  if (!isAiConfigured.value) {
    store.aiAdvice = null
    store.aiAdviceGeneratedAt = ''
    aiStatusType.value = 'info'
    aiStatusMessage.value = '已切换为本地规则建议，未调用真实 AI。'
    message.info(aiStatusMessage.value)
    return
  }

  if (!store.currentUserId) {
    aiError.value = '请先登录用户，再调用真实 AI 分析。'
    store.aiAdvice = null
    store.aiAdviceGeneratedAt = ''
    message.error(aiError.value)
    return
  }

  isGenerating.value = true
  const startedAt = performance.now()
  message.info('正在生成 AI 建议...')

  try {
    const aiRequestSettings =
      store.settings.aiProvider === 'deepseek'
        ? {
            ...store.settings,
            aiProvider: 'openai-compatible' as const,
            aiBaseUrl: store.settings.aiBaseUrl.trim() || deepSeekDefaults.baseUrl,
            aiModel: store.settings.aiModel.trim() || deepSeekDefaults.model,
          }
        : store.settings

    store.aiAdvice = await generateAiAdvice(store.currentUserId, {
      settings: {
        aiProvider: aiRequestSettings.aiProvider,
        aiBaseUrl: aiRequestSettings.aiBaseUrl,
        aiModel: aiRequestSettings.aiModel,
        aiTone: aiRequestSettings.aiTone,
        aiPromptPreference: aiRequestSettings.aiPromptPreference,
      },
      analysis: calculateSubmissionAnalysis(store.analysisSubmissions),
      weakTags: weakTagDetails.value,
      recentSubmissions: getRecentSubmissionSample(),
    })
    store.aiAdviceGeneratedAt = new Date().toISOString()
    store.saveAiAdviceToServer()
    const elapsedSeconds = Math.max(0.1, (performance.now() - startedAt) / 1000).toFixed(1)
    aiStatusType.value = 'success'
    aiStatusMessage.value = `AI 建议已生成：${aiRequestSettings.aiModel}，耗时 ${elapsedSeconds}s。`
    message.success(aiStatusMessage.value)
  } catch (error) {
    store.aiAdvice = null
    store.aiAdviceGeneratedAt = ''
    aiError.value = error instanceof Error ? error.message : 'AI 分析失败，已回退到本地规则建议。'
    message.error(aiError.value)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="page-stack">
    <section class="panel ai-brief">
      <p class="eyebrow">{{ store.aiAdvice ? 'AI Coach Live' : 'AI Coach Fallback' }}</p>
      <h2>联动能力画像的训练建议</h2>
      <p>{{ heroSummary }}</p>
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
          <span>分析模式</span>
          <strong>{{ store.aiAdvice ? '真实 AI' : isAiConfigured ? '待生成' : '本地规则' }}</strong>
        </div>
        <div v-if="store.aiAdviceGeneratedAt">
          <span>上次生成</span>
          <strong>{{ formatDateTime(store.aiAdviceGeneratedAt) }}</strong>
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
          <p class="eyebrow">{{ store.aiAdvice ? 'Live Result' : 'Fallback Result' }}</p>
          <h2>{{ modeTitle }}</h2>
        </div>
        <RouterLink v-if="activeMode === 'weekly-plan'" class="text-link" to="/training-plan">
          打开训练计划
        </RouterLink>
        <n-button v-else type="primary" secondary :loading="isGenerating" @click="generateAdvice">
          {{ generationLabel }}
        </n-button>
      </div>

      <n-alert v-if="!isAiConfigured" type="info" :bordered="false" class="ai-status-alert">
        未启用或未完整配置 AI 接口，当前使用本地规则分析。可前往设置页填写 API Base、API Key 和模型。
      </n-alert>
      <n-alert v-else-if="aiError" type="error" :bordered="false" class="ai-status-alert">
        {{ aiError }} 当前已显示本地规则兜底建议。
      </n-alert>
      <n-alert v-else-if="aiStatusMessage" :type="aiStatusType" :bordered="false" class="ai-status-alert">
        {{ aiStatusMessage }}
      </n-alert>

      <n-spin :show="isGenerating">
        <Transition name="tab-fade" mode="out-in">
          <div v-if="activeMode === 'rules'" :key="activeMode" class="analysis-list">
            <template v-if="store.aiAdvice">
              <article class="analysis-card">
                <div class="metric-top">
                  <h3>AI 总结</h3>
                  <n-tag type="success" size="small" round>{{ store.settings.aiModel }}</n-tag>
                </div>
                <p>{{ store.aiAdvice.summary }}</p>
                <strong>{{ store.aiAdvice.headline }}</strong>
              </article>
              <article
                v-for="item in store.aiAdvice.findings"
                :key="`${item.title}-${item.detail}`"
                class="analysis-card"
              >
                <div class="metric-top">
                  <h3>{{ item.title }}</h3>
                  <n-tag :type="severityType[item.severity || 'medium']" size="small" round>
                    {{ item.severity || 'medium' }}
                  </n-tag>
                </div>
                <p>{{ item.detail }}</p>
              </article>
              <article
                v-for="item in store.aiAdvice.actions"
                :key="`${item.title}-${item.detail}`"
                class="analysis-card"
              >
                <div class="metric-top">
                  <h3>{{ item.title }}</h3>
                  <n-tag type="info" size="small" round>
                    {{ item.days ? `${item.days} 天` : 'Action' }}
                  </n-tag>
                </div>
                <p>{{ item.detail }}</p>
              </article>
              <article class="analysis-card">
                <div class="metric-top">
                  <h3>本周重点</h3>
                  <n-tag type="success" size="small" round>Focus</n-tag>
                </div>
                <div class="submission-tags">
                  <n-tag v-for="item in store.aiAdvice.weeklyFocus" :key="item" size="small" round>
                    {{ item }}
                  </n-tag>
                  <n-tag
                    v-for="item in store.aiAdvice.recommendedTags"
                    :key="`tag-${item}`"
                    size="small"
                    round
                  >
                    {{ item }}
                  </n-tag>
                </div>
              </article>
            </template>
            <article v-for="item in tonedSummary.suggestions" v-else :key="item" class="analysis-card">
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

<style scoped>
.ai-status-alert {
  margin-bottom: 18px;
}
</style>

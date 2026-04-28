<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAlgoLinkStore } from '@/stores/algolink'
import {
  calculateSubmissionAnalysis,
  sortDifficultyDistribution,
  type AnalysisResult,
} from '@/utils/analysis'

const store = useAlgoLinkStore()
const isGenerating = ref(false)
const reportVisible = ref(false)
let generationTimer: ReturnType<typeof window.setTimeout> | undefined

const codeforcesAccount = computed(() =>
  store.accounts.find((account) => account.platform === 'Codeforces'),
)
const reportSubmissions = computed(() => store.codeforcesSubmissions)
const hasCodeforcesData = computed(() => reportSubmissions.value.length > 0)
const analysis = computed(() => calculateSubmissionAnalysis(reportSubmissions.value))
const recentAcceptanceRate = computed(() =>
  Math.round((analysis.value.recent30Accepted / Math.max(analysis.value.recent30Total, 1)) * 100),
)
const difficultyItems = computed(() =>
  sortDifficultyDistribution(analysis.value.difficultyDistribution).filter(
    (item) => item.value > 0,
  ),
)
const verdictItems = computed(() =>
  analysis.value.verdictDistribution.filter((item) => item.value > 0),
)
const strongestTag = computed(() => analysis.value.tagDistribution[0]?.name ?? '-')
const secondaryTag = computed(() => analysis.value.tagDistribution[1]?.name ?? '-')
const weakestTags = computed(() =>
  analysis.value.weakTags.length ? analysis.value.weakTags.join(' / ') : analysis.value.weakestTag,
)
const reportGeneratedAt = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()),
)

const trainingStage = computed(() => getTrainingStage(analysis.value))
const nextAdvice = computed(() => getNextAdvice(analysis.value))
const directionCards = computed(() => getDirectionCards(analysis.value))

function getTrainingStage(result: AnalysisResult) {
  if (result.recent30Total < 10) {
    return {
      title: '恢复训练节奏',
      level: 'Warm-up',
      detail: '近 30 天提交量偏低，当前更适合先恢复固定训练频率，再提高难度。',
    }
  }

  if (result.solvedProblems < 30) {
    return {
      title: '基础覆盖阶段',
      level: 'Foundation',
      detail: '已解决题量仍在积累期，建议优先扩大常见算法标签覆盖面。',
    }
  }

  if (result.acceptanceRate < 45) {
    return {
      title: '稳定性修复阶段',
      level: 'Stability',
      detail: '提交量已经形成样本，但非 AC 占比较高，下一步应加强复盘和边界检查。',
    }
  }

  if (result.recent30Accepted >= 20) {
    return {
      title: '进阶突破阶段',
      level: 'Advanced',
      detail: '近期训练活跃且通过量较高，可以开始挑战更高难度区间和综合题。',
    }
  }

  return {
    title: '稳态提升阶段',
    level: 'Balanced',
    detail: '训练数据较均衡，适合围绕薄弱标签做短周期专项提升。',
  }
}

function getNextAdvice(result: AnalysisResult) {
  if (!result.total) {
    return '同步 Codeforces 数据后，AlgoLink 会基于真实提交生成规则化训练诊断。'
  }

  if (result.recent30Total < 10) {
    return '先设定每周 3 次、每次 2-3 题的恢复计划，保证 30 天窗口内有稳定训练样本。'
  }

  if (result.acceptanceRate < 45) {
    return `优先复盘 ${result.weakestTag} 与 WA/TLE 记录，每道失败题补充失败原因和正确做法。`
  }

  if (result.weakTags.length) {
    return `下一阶段围绕 ${result.weakTags.join(' / ')} 做 7 天专项训练，每天保留至少 1 道复盘题。`
  }

  return '保持当前训练节奏，将训练重心从做题数量转向难度跨度和赛后复盘质量。'
}

function getDirectionCards(result: AnalysisResult) {
  const weakTag = result.weakTags[0] ?? result.weakestTag
  const topDifficulty = difficultyItems.value.at(-1)?.name ?? '1200-1399'
  const waCount = result.verdictDistribution.find((item) => item.name === 'WA')?.value ?? 0

  return [
    {
      label: '专项突破',
      title: weakTag && weakTag !== '-' ? weakTag : '薄弱标签复盘',
      text: '选择 6-8 道相近难度题目，按“先重做失败题，再补同类题”的顺序推进。',
    },
    {
      label: '难度推进',
      title: topDifficulty,
      text: '在当前主要难度层上增加少量上探题，避免长期停留在舒适区。',
    },
    {
      label: '提交质量',
      title: waCount >= 5 ? '降低 WA 占比' : '保持通过率',
      text: '提交前增加样例、边界、复杂度三项检查，把训练质量纳入报告复盘。',
    },
  ]
}

function generateReport() {
  if (!hasCodeforcesData.value || isGenerating.value) {
    return
  }

  isGenerating.value = true
  reportVisible.value = false
  window.clearTimeout(generationTimer)
  generationTimer = window.setTimeout(() => {
    isGenerating.value = false
    reportVisible.value = true
  }, 760)
}

onBeforeUnmount(() => {
  window.clearTimeout(generationTimer)
})
</script>

<template>
  <div class="page-stack report-page">
    <section class="report-hero">
      <div>
        <p class="eyebrow">Training Diagnostic Report</p>
        <h2>算法训练报告</h2>
        <p>
          基于已同步的 Codeforces
          公开提交记录，生成一份面向答辩展示的训练诊断书，覆盖近期状态、能力强弱项、难度结构和下一阶段训练建议。
        </p>
        <div class="hero-actions">
          <button
            class="report-generate-button"
            type="button"
            :disabled="!hasCodeforcesData || isGenerating"
            @click="generateReport"
          >
            <span v-if="isGenerating" class="loading-dot" aria-hidden="true" />
            {{ isGenerating ? '正在生成报告...' : '生成我的训练报告' }}
          </button>
          <RouterLink v-if="!hasCodeforcesData" class="secondary-link" to="/accounts">
            去绑定并同步账号
          </RouterLink>
        </div>
      </div>
      <div class="report-id-card">
        <span>Codeforces Handle</span>
        <strong>{{ codeforcesAccount?.handle || '未同步' }}</strong>
        <p>
          {{
            hasCodeforcesData ? `${reportSubmissions.length} 条真实提交记录` : '等待公开数据同步'
          }}
        </p>
      </div>
    </section>

    <section v-if="!hasCodeforcesData" class="panel report-empty">
      <p class="eyebrow">Data Required</p>
      <h3>请先绑定并同步 Codeforces 账号</h3>
      <p>
        训练报告只使用真实 Codeforces submissions 生成，不使用 mock
        提交记录。同步完成后，这里会展示“生成我的训练报告”入口。
      </p>
      <RouterLink class="text-link" to="/accounts">前往 OJ 账号绑定</RouterLink>
    </section>

    <section v-else-if="isGenerating" class="panel report-loading-panel">
      <div class="report-loader" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <h3>正在整理训练轨迹</h3>
      <p>分析最近 30 天提交、AC 情况、标签分布、难度结构和 verdict 失败类型。</p>
    </section>

    <template v-else-if="reportVisible">
      <section class="report-document">
        <div class="report-document-head">
          <div>
            <p class="eyebrow">AlgoLink Report</p>
            <h2>{{ trainingStage.title }}</h2>
            <p>{{ trainingStage.detail }}</p>
          </div>
          <div class="report-stamp">
            <span>{{ trainingStage.level }}</span>
            <strong>{{ reportGeneratedAt }}</strong>
          </div>
        </div>

        <div class="report-metrics">
          <article>
            <span>最近 30 天提交</span>
            <strong>{{ analysis.recent30Total }}</strong>
          </article>
          <article>
            <span>最近 30 天 AC</span>
            <strong>{{ analysis.recent30Accepted }}</strong>
          </article>
          <article>
            <span>已解决题目</span>
            <strong>{{ analysis.solvedProblems }}</strong>
          </article>
          <article>
            <span>近期 AC 率</span>
            <strong>{{ recentAcceptanceRate }}%</strong>
          </article>
        </div>

        <div class="report-section-grid">
          <article class="report-card report-card-strong">
            <span>强项识别</span>
            <h3>{{ strongestTag }}</h3>
            <p>
              当前最常训练标签为 {{ strongestTag }}，{{
                secondaryTag !== '-' ? `次高频方向为 ${secondaryTag}` : '可继续积累更多标签样本'
              }}。
            </p>
          </article>

          <article class="report-card report-card-warning">
            <span>薄弱点</span>
            <h3>{{ weakestTags }}</h3>
            <p>薄弱标签来自失败提交较多、通过率偏低的标签统计，建议作为下一阶段专项复盘入口。</p>
          </article>
        </div>

        <div class="report-section-grid">
          <article class="report-card">
            <span>难度分布总结</span>
            <div class="report-bars">
              <div v-for="item in difficultyItems" :key="item.name">
                <b>{{ item.name }}</b>
                <i>
                  <em
                    :style="{
                      width: `${Math.round((item.value / Math.max(analysis.total, 1)) * 100)}%`,
                    }"
                  />
                </i>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </article>

          <article class="report-card">
            <span>Verdict 分布总结</span>
            <div class="report-verdicts">
              <div v-for="item in verdictItems" :key="item.name">
                <strong>{{ item.name }}</strong>
                <span>{{ item.value }}</span>
              </div>
            </div>
          </article>
        </div>

        <article class="report-card report-advice-card">
          <span>下一阶段建议</span>
          <h3>{{ nextAdvice }}</h3>
        </article>
      </section>

      <section class="report-direction-grid">
        <article v-for="item in directionCards" :key="item.label" class="report-direction-card">
          <span>{{ item.label }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </section>
    </template>

    <section v-else class="report-preview panel">
      <p class="eyebrow">Ready</p>
      <h3>数据已就绪，可以生成训练报告</h3>
      <p>
        当前已读取 {{ reportSubmissions.length }} 条 Codeforces
        真实提交记录。点击上方按钮后会生成规则化 mock 报告，不调用真实 AI API。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAlgoLinkStore } from '@/stores/algolink'
import {
  calculateSubmissionAnalysis,
  sortDifficultyDistribution,
  type AnalysisResult,
} from '@/utils/analysis'
import type { UserSettings } from '@/types/algolink'
import { useMockAsync } from '@/composables/useMockAsync'

const store = useAlgoLinkStore()
const reportVisible = ref(false)
const { isGenerating, start } = useMockAsync(760)

const reportAccounts = computed(() =>
  store.accounts.filter((account) =>
    store.syncedSubmissions.some((submission) => submission.platform === account.platform),
  ),
)
const reportSubmissions = computed(() => store.syncedSubmissions)
const hasReportData = computed(() => reportSubmissions.value.length > 0)
const codeforcesAccount = computed(() => ({
  handle: reportAccounts.value
  .map((account) => `${account.platform}:${account.handle}`)
  .join(' / '),
}))
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

const trainingStage = computed(() => getTrainingStage(analysis.value, store.settings.aiTone))
const nextAdvice = computed(() => getNextAdvice(analysis.value, store.settings.aiTone))
const directionCards = computed(() => getDirectionCards(analysis.value))

function getTrainingStage(result: AnalysisResult, aiTone: UserSettings['aiTone'] = 'balanced') {
  if (result.recent30Total < 10) {
    return {
      title: '恢复训练节奏',
      level: 'Warm-up',
      detail:
        aiTone === 'strict'
          ? '近 30 天提交量严重偏低，必须立即恢复固定训练频率。'
          : aiTone === 'encouraging'
            ? '最近提交量略少，给自己一点时间慢慢恢复训练节奏就很棒～'
            : '近 30 天提交量偏低，当前更适合先恢复固定训练频率，再提高难度。',
    }
  }

  if (result.solvedProblems < 30) {
    return {
      title: '基础覆盖阶段',
      level: 'Foundation',
      detail:
        aiTone === 'strict'
          ? '已解决题量还未达标，需优先扩大算法标签覆盖面。'
          : aiTone === 'encouraging'
            ? '题目积累正在稳步进行中，继续扩大常见算法覆盖就能看到明显成长！'
            : '已解决题量仍在积累期，建议优先扩大常见算法标签覆盖面。',
    }
  }

  if (result.acceptanceRate < 45) {
    return {
      title: '稳定性修复阶段',
      level: 'Stability',
      detail:
        aiTone === 'strict'
          ? '非 AC 占比过高，必须加强复盘和边界检查流程。'
          : aiTone === 'encouraging'
            ? '通过率还有提升空间，每次提交前多留意一下边界条件，效果会越来越好～'
            : '提交量已经形成样本，但非 AC 占比较高，下一步应加强复盘和边界检查。',
    }
  }

  if (result.recent30Accepted >= 20) {
    return {
      title: '进阶突破阶段',
      level: 'Advanced',
      detail:
        aiTone === 'strict'
          ? '近期训练活跃，已达到进阶条件，开始挑战更高难度。'
          : aiTone === 'encouraging'
            ? '太厉害了！近期表现非常出色，可以试着挑战更高难度的综合题啦～'
            : '近期训练活跃且通过量较高，可以开始挑战更高难度区间和综合题。',
    }
  }

  return {
    title: '稳态提升阶段',
    level: 'Balanced',
    detail:
      aiTone === 'strict'
        ? '数据较均衡，围绕薄弱标签做短周期专项提升。'
        : aiTone === 'encouraging'
          ? '训练状态很均衡哦，继续保持节奏，偶尔挑战新标签会有惊喜！'
          : '训练数据较均衡，适合围绕薄弱标签做短周期专项提升。',
  }
}

function getNextAdvice(result: AnalysisResult, aiTone: UserSettings['aiTone'] = 'balanced') {
  if (!result.total) {
    return '同步公开账号数据后，AlgoLink 会基于真实提交生成规则化训练诊断。'
  }

  if (result.recent30Total < 10) {
    return aiTone === 'strict'
      ? '近 30 天训练量严重不足，本周必须设定每日固定训练时间并完成至少 5 次提交。'
      : aiTone === 'encouraging'
        ? '最近训练量略低没关系，试着这周找 2-3 个晚上安静刷几道题，节奏慢慢就回来了～'
        : '先设定每周 3 次、每次 2-3 题的恢复计划，保证 30 天窗口内有稳定训练样本。'
  }

  if (result.acceptanceRate < 45) {
    return aiTone === 'strict'
      ? `优先复盘 ${result.weakestTag} 与 WA/TLE 记录，每道失败题必须记录失败原因和正确做法。`
      : aiTone === 'encouraging'
        ? `${result.weakestTag} 方面还有一点提升空间，试着把之前的 WA 记录翻出来温习一下，会有意外收获哦～`
        : `优先复盘 ${result.weakestTag} 与 WA/TLE 记录，每道失败题补充失败原因和正确做法。`
  }

  if (result.weakTags.length) {
    return aiTone === 'strict'
      ? `下一阶段围绕 ${result.weakTags.join(' / ')} 执行 7 天专项训练，每天必须保留至少 1 道复盘题。`
      : aiTone === 'encouraging'
        ? `接下来可以试试 ${result.weakTags.join(' / ')} 的专项训练，不用太密集，每天 1-2 道题加上复盘就很好！`
        : `下一阶段围绕 ${result.weakTags.join(' / ')} 做 7 天专项训练，每天保留至少 1 道复盘题。`
  }

  return aiTone === 'strict'
    ? '保持当前训练节奏，将重心从做题数量转移到难度跨度和赛后复盘质量。'
    : aiTone === 'encouraging'
      ? '当前节奏很棒！继续保持，把注意力放在题目质量和赛后反思上，你会越来越强～'
      : '保持当前训练节奏，将训练重心从做题数量转向难度跨度和赛后复盘质量。'
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
  if (!hasReportData.value) return
  reportVisible.value = false
  start(() => {
    reportVisible.value = true
  })
}
</script>

<template>
  <div class="page-stack report-page">
    <section class="report-hero">
      <div>
        <p class="eyebrow">Training Diagnostic Report</p>
        <h2>算法训练报告</h2>
        <p>
          基于已同步的公开提交记录，生成一份产品化训练诊断书，覆盖近期状态、能力强弱项、难度结构和下一阶段训练建议。
        </p>
        <div class="hero-actions">
          <button
            class="report-generate-button"
            type="button"
            :disabled="!hasReportData || isGenerating"
            @click="generateReport"
          >
            <span v-if="isGenerating" class="loading-dot" aria-hidden="true" />
            {{ isGenerating ? '正在生成报告...' : '生成我的训练报告' }}
          </button>
          <RouterLink v-if="!hasReportData" class="secondary-link" to="/accounts">
            去绑定并同步账号
          </RouterLink>
        </div>
      </div>
      <div class="report-id-card">
        <span>Synced Handles</span>
        <strong>{{ codeforcesAccount?.handle || '未同步' }}</strong>
        <p>
          {{
            hasReportData ? `${reportSubmissions.length} 条真实提交记录` : '等待公开数据同步'
          }}
        </p>
      </div>
    </section>

    <section v-if="!hasReportData" class="panel report-empty">
      <p class="eyebrow">Data Required</p>
      <h3>请先绑定并同步 OJ 公开账号</h3>
      <p>
        训练报告使用已同步的真实提交记录生成，不使用 mock
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
        当前已读取 {{ reportSubmissions.length }} 条公开
        真实提交记录。点击上方按钮后会生成规则化 mock 报告，不调用真实 AI API。
      </p>
    </section>
  </div>
</template>

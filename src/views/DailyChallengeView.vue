<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NEmpty, NSpin, NTag, useMessage } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { DailyProblem } from '@/types/algolink'

const store = useAlgoLinkStore()
const message = useMessage()
const isLoading = ref(false)
const verifyingProblemId = ref('')

const challenge = computed(() => store.dailyChallenge)
const completedIds = computed(() => new Set(challenge.value?.completedProblemIds ?? []))
const easyProblem = computed(() =>
  challenge.value?.problems.find((problem) => problem.level === 'easy'),
)
const hardProblem = computed(() =>
  challenge.value?.problems.find((problem) => problem.level === 'hard'),
)

onMounted(() => {
  void loadChallenge()
})

async function loadChallenge() {
  if (isLoading.value) {
    return
  }

  isLoading.value = true
  const result = await store.loadDailyChallenge()
  message[result.ok ? 'success' : 'error'](result.message)
  isLoading.value = false
}

async function completeProblem(problem: DailyProblem) {
  if (verifyingProblemId.value) {
    return
  }

  verifyingProblemId.value = problem.id
  const result = await store.verifyAndCompleteDailyProblem(problem)
  message[result.ok ? 'success' : 'error'](result.message)
  verifyingProblemId.value = ''
}

function isCompleted(problem?: DailyProblem) {
  return !!problem && completedIds.value.has(problem.id)
}
</script>

<template>
  <div class="page-stack daily-page">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">Daily Challenge</p>
        <h2>每日一题</h2>
        <p>
          每天推荐 Easy 与 Hard 两档题目。完成按钮会先同步对应 OJ 的公开提交记录，只有检测到该题 AC
          后才会写入本地完成状态和排行榜积分。
        </p>
      </div>
      <div class="hero-scoreboard" aria-label="Daily score">
        <span>今日积分</span>
        <strong>{{ challenge?.awardedScore ?? 0 }}</strong>
        <p>{{ store.currentUsername }}</p>
      </div>
    </section>

    <n-spin :show="isLoading">
      <section v-if="challenge" class="daily-grid">
        <article v-for="problem in [easyProblem, hardProblem]" :key="problem?.id" class="daily-card">
          <template v-if="problem">
            <div class="daily-card-head">
              <n-tag :type="problem.level === 'easy' ? 'success' : 'warning'" round>
                {{ problem.level === 'easy' ? 'Easy' : 'Hard' }}
              </n-tag>
              <span>{{ problem.platform }}</span>
            </div>
            <h3>{{ problem.title }}</h3>
            <dl>
              <div>
                <dt>难度</dt>
                <dd>{{ problem.difficulty }}</dd>
              </div>
              <div>
                <dt>完成状态</dt>
                <dd>{{ isCompleted(problem) ? '已完成' : '待验证' }}</dd>
              </div>
            </dl>
            <div class="daily-actions">
              <a class="secondary-link" :href="problem.url" target="_blank" rel="noreferrer">
                打开题目
              </a>
              <n-button
                type="primary"
                strong
                :loading="verifyingProblemId === problem.id"
                :disabled="isCompleted(problem)"
                @click="completeProblem(problem)"
              >
                {{ isCompleted(problem) ? '已完成' : '验证 OJ AC' }}
              </n-button>
            </div>
          </template>
        </article>
      </section>

      <n-empty v-else description="还没有加载今日题目" class="empty-state naive-empty">
        <template #extra>
          <n-button type="primary" :loading="isLoading" @click="loadChallenge">
            加载每日一题
          </n-button>
        </template>
      </n-empty>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { NAlert, NEmpty, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import { getCodeforcesRankColor } from '@/utils/codeforcesRank'
import type { LeaderboardPeriod } from '@/services/api'

const store = useAlgoLinkStore()

interface RankedEntry {
  rank: number
  username: string
  score: number
  avatar?: string
  displayRankColor: string
  isCurrentUser: boolean
}

const periodOptions: { label: string; value: LeaderboardPeriod }[] = [
  { label: '总榜', value: 'all' },
  { label: '今日榜', value: 'today' },
  { label: '本周榜', value: 'week' },
  { label: '连续打卡', value: 'streak' },
]

const periodText: Record<LeaderboardPeriod, string> = {
  all: '累计积分',
  today: '今日积分',
  week: '本周积分',
  streak: '连续打卡天数',
}

const unitText = computed(() => (store.leaderboardPeriod === 'streak' ? '天' : '分'))
const profileNameColor = computed(() =>
  getCodeforcesRankColor(store.codeforcesAccount?.rating ?? 0),
)

function getLeaderboardNameColor(entry: { username: string; displayRankColor: string }) {
  return entry.username === 'Aarter' ? profileNameColor.value : entry.displayRankColor
}

const rankedEntries = computed<RankedEntry[]>(() => {
  let currentRank = 0
  let prevScore: number | undefined

  return store.leaderboard.map((entry, index) => {
    if (entry.score !== prevScore) {
      currentRank = index + 1
    }
    prevScore = entry.score

    return {
      rank: entry.rank ?? currentRank,
      username: entry.username,
      score: entry.score,
      avatar: entry.avatar,
      displayRankColor: entry.displayRankColor || getCodeforcesRankColor(entry.score),
      isCurrentUser: entry.username === 'Aarter',
    }
  })
})

const podium = computed(() => rankedEntries.value.slice(0, 3))
const showPodium = computed(() => podium.value.length >= 2)
const remainingEntries = computed(() => rankedEntries.value.slice(showPodium.value ? 3 : 0))
const myEntry = computed(() => store.currentLeaderboardUser)
const highestScore = computed(() => rankedEntries.value[0]?.score ?? 0)
const participantCount = computed(() => store.leaderboardTotal || rankedEntries.value.length)
const maxScore = computed(() => Math.max(highestScore.value, 1))
const previousGapText = computed(() => {
  if (!myEntry.value) {
    return '登录后显示你的排名'
  }

  if (myEntry.value.rank === 1) {
    return '你当前位于榜首'
  }

  return myEntry.value.gapToPrevious > 0
    ? `距离上一名还差 ${myEntry.value.gapToPrevious} ${unitText.value}`
    : '与上一名并列'
})

const podiumMedals = ['gold', 'silver', 'bronze'] as const
const podiumSizes = ['lg', 'md', 'sm'] as const
const podiumLabels = ['冠军', '亚军', '季军'] as const

watch(
  () => store.leaderboardPeriod,
  (period) => {
    void store.loadLeaderboardPeriod(period)
  },
)
</script>

<template>
  <div class="page-stack leaderboard-page">
    <section class="panel leaderboard-hero">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Leaderboard</p>
          <h2>排行榜</h2>
        </div>
        <n-tabs
          v-model:value="store.leaderboardPeriod"
          type="segment"
          size="small"
          class="leaderboard-tabs"
        >
          <n-tab-pane
            v-for="option in periodOptions"
            :key="option.value"
            :name="option.value"
            :tab="option.label"
          />
        </n-tabs>
      </div>

      <p class="leaderboard-intro">
        基于每日一题和公开 OJ 提交同步结果计分，展示训练投入、完成质量和持续打卡表现。当前榜单为
        {{ periodText[store.leaderboardPeriod] }}，共 {{ participantCount }} 位参与者。
      </p>

      <n-alert v-if="store.serverSyncMessage" type="warning" class="leaderboard-alert">
        {{ store.serverSyncMessage }}
      </n-alert>
    </section>

    <section class="stats-grid">
      <StatCard label="参与人数" :value="participantCount" helper="当前榜单统计人数" />
      <StatCard :label="periodText[store.leaderboardPeriod]" :value="highestScore" helper="当前榜首成绩" />
      <StatCard
        label="我的排名"
        :value="myEntry ? `#${myEntry.rank}` : '-'"
        :helper="previousGapText"
      />
    </section>

    <section v-if="myEntry" class="panel my-rank-panel">
      <div>
        <p class="eyebrow">My Rank</p>
        <h3 :style="{ color: profileNameColor }">{{ myEntry.username }}</h3>
      </div>
      <div class="my-rank-metrics">
        <span>#{{ myEntry.rank }}</span>
        <strong>{{ myEntry.score }} {{ unitText }}</strong>
        <small>{{ previousGapText }}</small>
      </div>
    </section>

    <n-spin :show="store.isLeaderboardLoading">
      <n-empty
        v-if="!rankedEntries.length"
        description="当前榜单暂无数据"
        class="empty-state naive-empty"
      />

      <template v-else>
        <section v-if="showPodium" class="podium-wrap" aria-label="Top 3 领奖台">
          <article
            v-for="(entry, index) in podium"
            :key="entry.username"
            class="podium-card"
            :class="[`podium-${podiumMedals[index]}`, entry.isCurrentUser && 'podium-current']"
          >
            <div class="podium-avatar" :class="`size-${podiumSizes[index]}`">
              <img
                v-if="entry.avatar"
                :src="entry.avatar"
                :alt="`${entry.username} avatar`"
              >
              <span v-else>{{ entry.username.slice(0, 2).toUpperCase() }}</span>
            </div>
            <div class="podium-badge">{{ podiumLabels[index] }}</div>
            <RouterLink
              class="podium-name"
              to="/profile"
              :style="{ color: getLeaderboardNameColor(entry) }"
            >
              {{ entry.username }}
            </RouterLink>
            <span class="podium-score">{{ entry.score }} {{ unitText }}</span>
            <n-tag v-if="entry.isCurrentUser" type="success" size="small" round>我</n-tag>
          </article>
        </section>

        <section v-if="remainingEntries.length" class="panel">
          <div class="leaderboard-list">
            <article
              v-for="entry in remainingEntries"
              :key="entry.username"
              class="leaderboard-row"
              :class="{ 'is-current-user': entry.isCurrentUser }"
            >
              <div class="leaderboard-main">
                <span class="leaderboard-rank">#{{ entry.rank }}</span>
                <span class="leaderboard-avatar-slot">
                  <img
                    v-if="entry.avatar"
                    :src="entry.avatar"
                    :alt="`${entry.username} avatar`"
                  >
                  <span v-else>{{ entry.username.slice(0, 1).toUpperCase() }}</span>
                </span>
                <RouterLink
                  class="leaderboard-username"
                  to="/profile"
                  :style="{ color: getLeaderboardNameColor(entry) }"
                >
                  {{ entry.username }}
                </RouterLink>
                <strong class="leaderboard-score">{{ entry.score }} {{ unitText }}</strong>
                <n-tag v-if="entry.isCurrentUser" type="success" size="small" round>我</n-tag>
              </div>
              <div class="leaderboard-bar">
                <i :style="{ width: `${(entry.score / maxScore) * 100}%` }" />
              </div>
            </article>
          </div>
        </section>
      </template>
    </n-spin>
  </div>
</template>

<style scoped>
.leaderboard-hero {
  display: grid;
  gap: 12px;
}

.leaderboard-intro {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.leaderboard-alert {
  margin-top: 2px;
}

.leaderboard-tabs {
  max-width: 420px;
}

.my-rank-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.my-rank-panel h3 {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 850;
}

.my-rank-metrics {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--color-text-soft);
}

.my-rank-metrics span {
  color: var(--color-accent);
  font-size: 24px;
  font-weight: 850;
}

.my-rank-metrics strong {
  color: var(--color-heading);
  font-size: 18px;
}

.my-rank-metrics small {
  color: var(--color-text-muted);
  font-size: 13px;
}

.podium-wrap {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.podium-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(194, 138, 46, 0.055), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 44%), var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.podium-gold {
  border-color: rgba(212, 175, 55, 0.32);
}

.podium-silver {
  border-color: rgba(168, 180, 194, 0.28);
}

.podium-bronze {
  border-color: rgba(180, 120, 62, 0.28);
}

.podium-current {
  box-shadow: 0 0 0 1px rgba(194, 138, 46, 0.28), 0 12px 30px rgba(0, 0, 0, 0.12);
}

.podium-avatar {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-heading);
  font-weight: 800;
}

.podium-avatar img,
.leaderboard-avatar-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.podium-avatar.size-lg {
  width: 64px;
  height: 64px;
  font-size: 18px;
}

.podium-avatar.size-md {
  width: 54px;
  height: 54px;
  font-size: 15px;
}

.podium-avatar.size-sm {
  width: 46px;
  height: 46px;
  font-size: 14px;
}

.podium-badge {
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 800;
}

.podium-name {
  max-width: 100%;
  overflow: hidden;
  font-size: 15px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-score {
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 700;
}

.leaderboard-list {
  display: grid;
  gap: 6px;
}

.leaderboard-row {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.025), transparent 42%), var(--color-surface);
}

.leaderboard-row:hover {
  border-color: var(--color-border);
}

.leaderboard-row.is-current-user {
  border-color: rgba(194, 138, 46, 0.28);
  background: linear-gradient(135deg, rgba(142, 39, 36, 0.07), transparent 44%),
    var(--color-surface);
}

.leaderboard-main {
  display: grid;
  grid-template-columns: 44px 38px minmax(120px, 1fr) auto auto;
  align-items: center;
  gap: 12px;
}

.leaderboard-rank {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.leaderboard-avatar-slot {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-soft);
  font-size: 12px;
  font-weight: 780;
}

.leaderboard-username {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderboard-bar {
  height: 6px;
  min-width: 60px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(154, 170, 190, 0.08);
}

.leaderboard-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-blue), var(--color-violet));
  opacity: 0.6;
}

.leaderboard-row.is-current-user .leaderboard-bar i {
  opacity: 0.86;
}

.leaderboard-score {
  color: var(--color-heading);
  text-align: right;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .leaderboard-hero :deep(.panel-heading) {
    align-items: flex-start;
    flex-direction: column;
  }

  .my-rank-panel,
  .my-rank-metrics {
    align-items: flex-start;
    flex-direction: column;
  }

  .podium-wrap {
    grid-template-columns: 1fr;
  }

  .podium-card {
    flex-direction: row;
    justify-content: flex-start;
    gap: 14px;
  }

  .leaderboard-main {
    grid-template-columns: 38px 38px minmax(0, 1fr) auto;
  }

  .leaderboard-main .n-tag {
    grid-column: 3 / 5;
    justify-self: start;
  }
}
</style>

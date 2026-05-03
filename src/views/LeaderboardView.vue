<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import StatCard from '@/components/common/StatCard.vue'
import { useAlgoLinkStore } from '@/stores/algolink'

const store = useAlgoLinkStore()

interface RankedEntry {
  rank: number
  username: string
  score: number
  isCurrentUser: boolean
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
      rank: currentRank,
      username: entry.username,
      score: entry.score,
      isCurrentUser: entry.username === store.currentUsername,
    }
  })
})

const podium = computed(() => rankedEntries.value.slice(0, 3))
const showPodium = computed(() => podium.value.length >= 2)
const remainingEntries = computed(() => rankedEntries.value.slice(3))
const myEntry = computed(() => rankedEntries.value.find((entry) => entry.isCurrentUser))
const highestScore = computed(() => rankedEntries.value[0]?.score ?? 0)
const participantCount = computed(() => rankedEntries.value.length)

const podiumMedals = ['gold', 'silver', 'bronze'] as const
const podiumSizes = ['lg', 'md', 'sm'] as const

const maxScore = computed(() =>
  Math.max(highestScore.value, 1),
)
</script>

<template>
  <div class="page-stack leaderboard-page">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Leaderboard</p>
          <h2>排行榜</h2>
        </div>
      </div>

      <p class="leaderboard-intro">
        基于每日一题计分，完成 Easy 题按难度计分，Hard 题取较高分。当前共 {{ participantCount }}
        位参与者。
      </p>
    </section>

    <section class="stats-grid">
      <StatCard label="参与人数" :value="participantCount" helper="所有绑定公开 handle 的用户" />
      <StatCard label="最高分" :value="highestScore" helper="当前 leaderboard 榜首" />
      <StatCard
        label="我的排名"
        :value="myEntry ? `#${myEntry.rank}` : '-'"
        helper="每日一题累计得分排名"
      />
    </section>

    <section v-if="showPodium" class="podium-wrap" aria-label="Top 3 领奖台">
      <article
        v-for="(entry, index) in podium"
        :key="entry.username"
        class="podium-card"
        :class="[`podium-${podiumMedals[index]}`, entry.isCurrentUser && 'podium-current']"
      >
        <div class="podium-avatar" :class="`size-${podiumSizes[index]}`">
          <span>{{ entry.username.slice(0, 2).toUpperCase() }}</span>
        </div>
        <div class="podium-badge">{{ podiumMedals[index] === 'gold' ? '🥇' : podiumMedals[index] === 'silver' ? '🥈' : '🥉' }}</div>
        <strong class="podium-name">{{ entry.username }}</strong>
        <span class="podium-score">{{ entry.score }} 分</span>
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
          <span class="leaderboard-rank">#{{ entry.rank }}</span>
          <span class="leaderboard-avatar-slot">{{ entry.username.slice(0, 1).toUpperCase() }}</span>
          <span class="leaderboard-username">{{ entry.username }}</span>
          <div class="leaderboard-bar">
            <i :style="{ width: `${(entry.score / maxScore) * 100}%` }" />
          </div>
          <strong class="leaderboard-score">{{ entry.score }}</strong>
          <n-tag v-if="entry.isCurrentUser" type="success" size="small" round>我</n-tag>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.leaderboard-intro {
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
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
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.09), transparent 55%),
    var(--color-surface);
}

.podium-silver {
  border-color: rgba(168, 180, 194, 0.28);
  background: linear-gradient(180deg, rgba(168, 180, 194, 0.07), transparent 55%),
    var(--color-surface);
}

.podium-bronze {
  border-color: rgba(180, 120, 62, 0.28);
  background: linear-gradient(180deg, rgba(180, 120, 62, 0.07), transparent 55%),
    var(--color-surface);
}

.podium-current {
  box-shadow: 0 0 0 1px rgba(194, 138, 46, 0.28), 0 12px 30px rgba(0, 0, 0, 0.12);
}

.podium-avatar {
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-heading);
  font-weight: 800;
}

.podium-avatar.size-lg {
  width: 56px;
  height: 56px;
  font-size: 18px;
}

.podium-avatar.size-md {
  width: 48px;
  height: 48px;
  font-size: 15px;
}

.podium-avatar.size-sm {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.podium-badge {
  font-size: 28px;
  line-height: 1;
}

.podium-name {
  color: var(--color-heading);
  font-size: 15px;
  font-weight: 780;
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
  display: flex;
  align-items: center;
  gap: 12px;
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

.leaderboard-rank {
  min-width: 38px;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.leaderboard-avatar-slot {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-soft);
  font-size: 12px;
  font-weight: 780;
}

.leaderboard-username {
  min-width: 140px;
  color: var(--color-heading);
  font-size: 14px;
  font-weight: 720;
}

.leaderboard-bar {
  flex: 1;
  height: 6px;
  min-width: 60px;
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
  min-width: 56px;
  color: var(--color-heading);
  text-align: right;
  font-size: 15px;
  font-weight: 800;
}

@media (max-width: 640px) {
  .podium-wrap {
    grid-template-columns: 1fr;
  }

  .podium-card {
    flex-direction: row;
    justify-content: flex-start;
    gap: 14px;
  }
}
</style>

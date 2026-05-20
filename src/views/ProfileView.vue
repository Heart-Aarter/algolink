<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { NEmpty, NTag } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import { calculateSubmissionAnalysis } from '@/utils/analysis'
import { getCodeforcesRankColor, getCodeforcesRankLabel } from '@/utils/codeforcesRank'

const store = useAlgoLinkStore()

const analysis = computed(() => calculateSubmissionAnalysis(store.analysisSubmissions))
const codeforcesAccount = computed(() => store.codeforcesAccount)
const leaderboardUser = computed(() => store.currentLeaderboardUser)
const profileScore = computed(() => leaderboardUser.value?.score ?? codeforcesAccount.value?.rating ?? 0)
const codeforcesRating = computed(() => codeforcesAccount.value?.rating ?? 0)
const usernameColor = computed(() => getCodeforcesRankColor(codeforcesRating.value))
const rankLabel = computed(() => getCodeforcesRankLabel(codeforcesRating.value))
const profileAvatar = computed(() => store.currentUserAvatar)
const recentSubmissions = computed(() => store.analysisSubmissions.slice(0, 8))
const lastSyncAt = computed(() => {
  const syncedAccounts = store.accounts.filter((account) => account.lastSyncAt)
  return syncedAccounts[0]?.lastSyncAt ?? '暂无同步记录'
})
const boundOjText = computed(() =>
  store.accounts.length ? store.accounts.map((account) => account.platform).join(' / ') : '未绑定',
)
const cfProfileUrl = computed(() =>
  codeforcesAccount.value
    ? `https://codeforces.com/profile/${codeforcesAccount.value.handle}`
    : `https://codeforces.com/profile/${store.currentUsername}`,
)
</script>

<template>
  <div class="page-stack profile-page">
    <section class="profile-layout">
      <aside class="profile-card">
        <div class="profile-avatar-frame">
          <img
            v-if="profileAvatar"
            :src="profileAvatar"
            :alt="`${store.currentUsername} avatar`"
            class="profile-avatar"
          >
          <span v-else class="profile-avatar placeholder">
            {{ store.currentUsername.slice(0, 2).toUpperCase() }}
          </span>
        </div>

        <h2 :style="{ color: usernameColor }">{{ store.currentUsername }}</h2>
        <p>{{ rankLabel }}</p>

        <a class="cf-link" :href="cfProfileUrl" target="_blank" rel="noreferrer">
          Codeforces profile
        </a>

        <dl class="profile-facts">
          <div>
            <dt>当前积分</dt>
            <dd>{{ profileScore }}</dd>
          </div>
          <div>
            <dt>排行榜名次</dt>
            <dd>{{ leaderboardUser ? `#${leaderboardUser.rank}` : '-' }}</dd>
          </div>
          <div>
            <dt>绑定 OJ</dt>
            <dd>{{ boundOjText }}</dd>
          </div>
          <div>
            <dt>最近同步</dt>
            <dd>{{ lastSyncAt }}</dd>
          </div>
        </dl>
      </aside>

      <section class="profile-main">
        <div class="cf-style-panel">
          <div class="profile-heading">
            <div>
              <h2>训练概览</h2>
              <p>按公开提交和每日挑战生成当前用户画像。</p>
            </div>
            <n-tag round :color="{ color: usernameColor, textColor: '#071015' }">
              {{ rankLabel }}
            </n-tag>
          </div>

          <div class="profile-stats">
            <div>
              <span>提交</span>
              <strong>{{ analysis.total }}</strong>
            </div>
            <div>
              <span>Accepted</span>
              <strong>{{ analysis.accepted }}</strong>
            </div>
            <div>
              <span>已解决</span>
              <strong>{{ analysis.solvedProblems }}</strong>
            </div>
            <div>
              <span>近 30 天</span>
              <strong>{{ analysis.recent30Total }}</strong>
            </div>
            <div>
              <span>常练标签</span>
              <strong>{{ analysis.topTrainingTag }}</strong>
            </div>
            <div>
              <span>薄弱标签</span>
              <strong>{{ analysis.weakestTag }}</strong>
            </div>
          </div>
        </div>

        <div class="profile-grid">
          <article class="cf-style-panel">
            <div class="profile-heading compact">
              <h3>绑定账号</h3>
              <RouterLink class="text-link" to="/accounts">管理</RouterLink>
            </div>
            <div v-if="store.accounts.length" class="account-list">
              <div v-for="account in store.accounts" :key="account.id" class="account-row">
                <span class="account-platform" :style="{ borderColor: account.color }">
                  {{ account.platform }}
                </span>
                <div>
                  <strong>{{ account.handle }}</strong>
                  <small>
                    rating {{ account.rating || '-' }} · solved {{ account.solved }}
                  </small>
                </div>
                <img
                  v-if="account.avatar"
                  :src="account.avatar"
                  :alt="`${account.handle} avatar`"
                  class="account-avatar"
                >
              </div>
            </div>
            <n-empty v-else description="暂无绑定账号" class="empty-state naive-empty" />
          </article>

          <article class="cf-style-panel">
            <div class="profile-heading compact">
              <h3>Codeforces 信息</h3>
              <n-tag size="small" round>{{ codeforcesAccount?.rank || '未同步' }}</n-tag>
            </div>
            <dl class="cf-info-list">
              <div>
                <dt>当前 rating</dt>
                <dd>{{ codeforcesAccount?.rating || '-' }}</dd>
              </div>
              <div>
                <dt>最高 rating</dt>
                <dd>{{ codeforcesAccount?.maxRating || '-' }}</dd>
              </div>
              <div>
                <dt>最高 rank</dt>
                <dd>{{ codeforcesAccount?.maxRank || '-' }}</dd>
              </div>
              <div>
                <dt>最后在线</dt>
                <dd>{{ codeforcesAccount?.lastOnlineAt || '-' }}</dd>
              </div>
              <div>
                <dt>注册时间</dt>
                <dd>{{ codeforcesAccount?.registeredAt || '-' }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <article class="cf-style-panel">
          <div class="profile-heading compact">
            <h3>最近提交</h3>
            <RouterLink class="text-link" to="/submissions">查看全部</RouterLink>
          </div>
          <div v-if="recentSubmissions.length" class="submission-list">
            <div v-for="submission in recentSubmissions" :key="submission.id" class="submission-row">
              <span>{{ submission.platform }}</span>
              <strong>{{ submission.problem }}</strong>
              <n-tag
                size="small"
                :type="submission.status === 'Accepted' ? 'success' : 'warning'"
                round
              >
                {{ submission.status }}
              </n-tag>
              <small>{{ submission.submittedAt }}</small>
            </div>
          </div>
          <n-empty v-else description="暂无提交记录" class="empty-state naive-empty" />
        </article>
      </section>
    </section>
  </div>
</template>

<style scoped>
.profile-layout {
  display: grid;
  grid-template-columns: minmax(230px, 280px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.profile-card,
.cf-style-panel {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 44%),
    var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.profile-card {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.profile-avatar-frame {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(154, 170, 190, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  aspect-ratio: 1 / 1;
}

.profile-avatar {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  object-fit: cover;
}

.profile-avatar.placeholder {
  color: var(--color-heading);
  font-size: 44px;
  font-weight: 850;
}

.profile-card h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 850;
}

.profile-card p {
  margin: -8px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 720;
}

.cf-link {
  color: var(--color-blue);
  font-size: 13px;
  font-weight: 780;
}

.profile-facts,
.cf-info-list {
  display: grid;
  gap: 8px;
  margin: 0;
}

.profile-facts div,
.cf-info-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid rgba(154, 170, 190, 0.12);
}

dt {
  color: var(--color-text-muted);
  font-size: 12px;
}

dd {
  margin: 0;
  color: var(--color-heading);
  font-size: 13px;
  font-weight: 780;
  text-align: right;
}

.profile-main {
  display: grid;
  gap: 18px;
}

.cf-style-panel {
  padding: 18px;
}

.profile-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.profile-heading h2,
.profile-heading h3 {
  margin: 0;
  color: var(--color-heading);
  font-weight: 830;
}

.profile-heading h2 {
  font-size: 22px;
}

.profile-heading h3 {
  font-size: 16px;
}

.profile-heading p {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.profile-heading.compact {
  align-items: center;
  margin-bottom: 12px;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border: 1px solid rgba(154, 170, 190, 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.profile-stats div {
  display: grid;
  gap: 6px;
  min-height: 82px;
  padding: 14px;
  border-right: 1px solid rgba(154, 170, 190, 0.12);
  background: rgba(255, 255, 255, 0.025);
}

.profile-stats div:last-child {
  border-right: 0;
}

.profile-stats span,
.account-row small,
.submission-row small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.profile-stats strong {
  min-width: 0;
  overflow: hidden;
  color: var(--color-heading);
  font-size: 20px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.account-list,
.submission-list {
  display: grid;
  gap: 8px;
}

.account-row,
.submission-row {
  display: grid;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(154, 170, 190, 0.11);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
}

.account-row {
  grid-template-columns: auto minmax(0, 1fr) 34px;
}

.account-platform {
  padding: 4px 8px;
  border: 1px solid;
  border-radius: 999px;
  color: var(--color-text-soft);
  font-size: 12px;
  font-weight: 760;
}

.account-row strong,
.submission-row strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--color-heading);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  object-fit: cover;
}

.submission-row {
  grid-template-columns: 92px minmax(0, 1fr) auto 138px;
}

.submission-row > span {
  color: var(--color-text-soft);
  font-size: 12px;
  font-weight: 760;
}

@media (max-width: 980px) {
  .profile-layout,
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-card {
    grid-template-columns: 112px minmax(0, 1fr);
    align-items: center;
  }

  .profile-avatar-frame,
  .profile-facts {
    grid-row: span 3;
  }

  .profile-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .profile-card {
    grid-template-columns: 1fr;
  }

  .profile-avatar-frame {
    max-width: 180px;
  }

  .profile-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .submission-row {
    grid-template-columns: 1fr auto;
  }

  .submission-row > span,
  .submission-row small {
    grid-column: 1 / -1;
  }
}
</style>

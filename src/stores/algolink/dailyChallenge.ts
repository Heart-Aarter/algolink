import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchDailyProblems } from '@/services/dailyChallenge'
import { saveDailyChallenge } from '@/services/api'
import type { DailyChallengeState, DailyProblem } from '@/types/algolink'
import { formatDateKey } from '@/utils/date'
import { readStorage, writeStorage } from '@/utils/storage'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { useSubmissionsStore } from './submissions'
import { useAccountsStore } from './accounts'
import { useLeaderboardStore } from './leaderboard'
import { normalizeDailyChallenge } from './shared/normalizers'
import { getUserCacheKey, storageKeys } from './shared/storageKeys'

export const useDailyChallengeStore = defineStore('algolink/dailyChallenge', () => {
  const session = useSessionStore()
  const initialUserId = session.currentUserId

  const dailyChallenge = ref<DailyChallengeState | null>(
    initialUserId
      ? normalizeDailyChallenge(
          readStorage<unknown>(getUserCacheKey(initialUserId, 'dailyChallenge'), null),
        )
      : readStorage<DailyChallengeState | null>(storageKeys.dailyChallenge, null),
  )

  function persistDailyChallenge() {
    const userId = session.currentUserId
    const key = userId ? getUserCacheKey(userId, 'dailyChallenge') : storageKeys.dailyChallenge
    writeStorage(key, dailyChallenge.value)
  }

  function pushDailyChallengeToServer() {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    saveDailyChallenge(userId, dailyChallenge.value)
      .then(() => {
        useSyncStore().serverSyncMessage = ''
      })
      .catch(() => {
        useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
      })
  }

  async function loadDailyChallenge(): Promise<{ ok: boolean; message: string }> {
    const today = formatDateKey()

    if (dailyChallenge.value?.date === today && dailyChallenge.value.problems.length === 3) {
      return { ok: true, message: '今日题目已加载。' }
    }

    try {
      const problems = await fetchDailyProblems(today)

      dailyChallenge.value = {
        date: today,
        problems,
        completedProblemIds: [],
        awardedScore: 0,
      }
      persistDailyChallenge()
      pushDailyChallengeToServer()

      return { ok: true, message: '每日一题已刷新。' }
    } catch (error) {
      const message = error instanceof Error ? error.message : '每日一题题库请求失败'
      return { ok: false, message }
    }
  }

  function completeDailyProblem(problemId: string): { ok: boolean; message: string } {
    if (!dailyChallenge.value) {
      return { ok: false, message: '请先加载每日一题。' }
    }

    if (!dailyChallenge.value.completedProblemIds.includes(problemId)) {
      dailyChallenge.value.completedProblemIds = [
        ...dailyChallenge.value.completedProblemIds,
        problemId,
      ]
    }

    const completedProblems = dailyChallenge.value.problems.filter((problem) =>
      dailyChallenge.value?.completedProblemIds.includes(problem.id),
    )
    const nextAwardedScore = Math.max(0, ...completedProblems.map((problem) => problem.difficulty))
    const delta = nextAwardedScore - dailyChallenge.value.awardedScore

    dailyChallenge.value.awardedScore = nextAwardedScore
    persistDailyChallenge()
    pushDailyChallengeToServer()

    if (delta > 0) {
      useLeaderboardStore().addLeaderboardScore(
        session.currentUsername,
        delta,
        `daily:${session.currentUsername}:${dailyChallenge.value.date}:${problemId}`,
        dailyChallenge.value.date,
      )
    }

    return { ok: true, message: `每日一题已完成，本日计分 ${nextAwardedScore}。` }
  }

  function hasAcceptedDailyProblem(problem: DailyProblem) {
    const submissions = useSubmissionsStore()
    const expectedId = problem.id.startsWith('cf-')
      ? problem.id.replace(/^cf-/, '')
      : problem.id

    return submissions.syncedSubmissions.some((submission) => {
      if (submission.platform !== problem.platform || submission.status !== 'Accepted') {
        return false
      }

      return (
        submission.problemId === expectedId ||
        submission.problemId === problem.id ||
        submission.problem.includes(problem.title) ||
        problem.title.includes(submission.problemId ?? '')
      )
    })
  }

  async function verifyAndCompleteDailyProblem(
    problem: DailyProblem,
  ): Promise<{ ok: boolean; message: string }> {
    const accounts = useAccountsStore()
    const submissions = useSubmissionsStore()
    const account = accounts.accounts.find((item) => item.platform === problem.platform)

    if (!account) {
      return {
        ok: false,
        message: `请先绑定并同步 ${problem.platform} 账号，再验证每日一题完成状态。`,
      }
    }

    const syncResult = await submissions.syncOjAccount(account.id)

    if (!syncResult.ok) {
      return syncResult
    }

    if (!hasAcceptedDailyProblem(problem)) {
      return {
        ok: false,
        message: `未在 ${problem.platform} 公开提交中检测到该题 AC，请完成后再验证。`,
      }
    }

    return completeDailyProblem(problem.id)
  }

  function loadFromCache(userId: string) {
    dailyChallenge.value = normalizeDailyChallenge(
      readStorage<unknown>(getUserCacheKey(userId, 'dailyChallenge'), null),
    )
  }

  async function applyServerHydration(payload: {
    serverDailyChallenge: unknown | null
    allowLegacyMigration: boolean
    hasUserDailyChallengeCache: boolean
  }) {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    const userDailyChallengeKey = getUserCacheKey(userId, 'dailyChallenge')
    dailyChallenge.value = payload.serverDailyChallenge
      ? normalizeDailyChallenge(payload.serverDailyChallenge)
      : normalizeDailyChallenge(
          payload.allowLegacyMigration && !payload.hasUserDailyChallengeCache
            ? readStorage<DailyChallengeState | null>(storageKeys.dailyChallenge, null)
            : readStorage<unknown>(userDailyChallengeKey, null),
        )
    persistDailyChallenge()

    if (
      !payload.serverDailyChallenge &&
      payload.allowLegacyMigration &&
      !payload.hasUserDailyChallengeCache &&
      dailyChallenge.value
    ) {
      await saveDailyChallenge(userId, dailyChallenge.value)
    }
  }

  function resetToDefaults() {
    dailyChallenge.value = null
    persistDailyChallenge()
  }

  return {
    dailyChallenge,
    loadDailyChallenge,
    completeDailyProblem,
    verifyAndCompleteDailyProblem,
    hasAcceptedDailyProblem,
    persistDailyChallenge,
    loadFromCache,
    applyServerHydration,
    resetToDefaults,
  }
})

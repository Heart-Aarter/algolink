import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { mockSubmissions } from '@/mock/algolink'
import {
  fetchCodeforcesRating,
  fetchCodeforcesSubmissions,
  fetchCodeforcesUser,
} from '@/services/codeforces'
import { fetchAtCoderSubmissions, fetchAtCoderUser } from '@/services/atcoder'
import { fetchLuoguSyncData } from '@/services/luogu'
import { saveSubmissions } from '@/services/api'
import { toSubmissionRecord } from '@/services/normalizers'
import type { OjPlatform, SubmissionRecord } from '@/types/algolink'
import { getProblemKey } from '@/utils/analysis'
import { readStorage, writeStorage } from '@/utils/storage'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { useAccountsStore } from './accounts'
import { useLeaderboardStore } from './leaderboard'
import { formatDateTime, getCodeforcesRatingSnapshot } from './shared/format'
import {
  hasSubmissionCache,
  normalizeSubmissionCache,
} from './shared/normalizers'
import { getUserCacheKey, storageKeys } from './shared/storageKeys'

export const useSubmissionsStore = defineStore('algolink/submissions', () => {
  const session = useSessionStore()
  const initialUserId = session.currentUserId

  const initialCache = initialUserId
    ? normalizeSubmissionCache(
        readStorage<unknown>(getUserCacheKey(initialUserId, 'submissions'), {}),
      )
    : {
        Codeforces: readStorage<SubmissionRecord[]>(storageKeys.codeforcesSubmissions, []),
        Luogu: readStorage<SubmissionRecord[]>(storageKeys.luoguSubmissions, []),
        AtCoder: readStorage<SubmissionRecord[]>(storageKeys.atcoderSubmissions, []),
      }

  const codeforcesSubmissions = shallowRef<SubmissionRecord[]>(initialCache.Codeforces)
  const atcoderSubmissions = shallowRef<SubmissionRecord[]>(initialCache.AtCoder)
  const luoguSubmissions = shallowRef<SubmissionRecord[]>(initialCache.Luogu)

  function getSubmissionCache() {
    return {
      Codeforces: codeforcesSubmissions.value,
      Luogu: luoguSubmissions.value,
      AtCoder: atcoderSubmissions.value,
    }
  }

  function persistSubmissions() {
    const userId = session.currentUserId
    if (userId) {
      writeStorage(getUserCacheKey(userId, 'submissions'), getSubmissionCache())
      return
    }

    writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
    writeStorage(storageKeys.atcoderSubmissions, atcoderSubmissions.value)
    writeStorage(storageKeys.luoguSubmissions, luoguSubmissions.value)
  }

  function pushSubmissionsToServer() {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    saveSubmissions(userId, getSubmissionCache())
      .then(() => {
        useSyncStore().serverSyncMessage = ''
      })
      .catch(() => {
        useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
      })
  }

  const syncedSubmissions = computed(() => [
    ...codeforcesSubmissions.value,
    ...atcoderSubmissions.value,
    ...luoguSubmissions.value,
  ])
  const hasSyncedSubmissions = computed(() => syncedSubmissions.value.length > 0)
  const submissions = computed(() => {
    if (!hasSyncedSubmissions.value) {
      return mockSubmissions
    }

    return [
      ...codeforcesSubmissions.value,
      ...atcoderSubmissions.value,
      ...luoguSubmissions.value,
      ...mockSubmissions.filter((item) => {
        if (item.platform === 'Codeforces') {
          return !codeforcesSubmissions.value.length
        }

        if (item.platform === 'AtCoder') {
          return !atcoderSubmissions.value.length
        }

        if (item.platform === 'Luogu') {
          return !luoguSubmissions.value.length
        }

        return true
      }),
    ]
  })
  const analysisSubmissions = computed(() =>
    hasSyncedSubmissions.value ? syncedSubmissions.value : submissions.value,
  )
  const submissionDataSourceLabel = computed(() => {
    const platforms = [
      codeforcesSubmissions.value.length ? 'Codeforces' : '',
      atcoderSubmissions.value.length ? 'AtCoder' : '',
      luoguSubmissions.value.length ? 'Luogu' : '',
    ].filter(Boolean)

    return platforms.length ? `真实 ${platforms.join(' + ')} 数据` : 'mock 兜底数据'
  })

  function clearSyncedSubmissions(platform: OjPlatform) {
    if (platform === 'Codeforces') {
      codeforcesSubmissions.value = []
    } else if (platform === 'AtCoder') {
      atcoderSubmissions.value = []
    } else {
      luoguSubmissions.value = []
    }
    persistSubmissions()
    pushSubmissionsToServer()
  }

  async function syncCodeforcesAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const accounts = useAccountsStore()
    const leaderboard = useLeaderboardStore()
    const account = accounts.accounts.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform !== 'Codeforces') {
      accounts.syncAccount(id)
      return { ok: true, message: `${account.platform} mock 数据已刷新。` }
    }

    try {
      const [profile, ratingChanges, syncedItems] = await Promise.all([
        fetchCodeforcesUser(account.handle),
        fetchCodeforcesRating(account.handle),
        fetchCodeforcesSubmissions(account.handle),
      ])
      const records = syncedItems.map(toSubmissionRecord)
      const ratingSnapshot = getCodeforcesRatingSnapshot(profile, ratingChanges)
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      codeforcesSubmissions.value = records
      leaderboard.recordCodeforcesProfile(profile.handle, {
        avatar: profile.avatar || '',
        rating: ratingSnapshot.rating,
        rank: profile.rank,
        fetchedAt: new Date().toISOString(),
      })
      accounts.recordAccountSync(id, {
        handle: profile.handle,
        rating: ratingSnapshot.rating,
        maxRating: ratingSnapshot.maxRating,
        rank: profile.rank,
        maxRank: profile.maxRank,
        avatar: profile.avatar,
        registeredAt: profile.registeredAt,
        lastOnlineAt: profile.lastOnlineAt,
        solved: acceptedProblems.size,
        lastSyncAt: formatDateTime(),
      })
      persistSubmissions()
      pushSubmissionsToServer()

      return {
        ok: true,
        message: `Codeforces 同步成功，已保存最近 ${records.length} 条提交。`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Codeforces API 请求失败'
      return { ok: false, message: `Codeforces 同步失败：${message}` }
    }
  }

  async function syncAtCoderAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const accounts = useAccountsStore()
    const account = accounts.accounts.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform !== 'AtCoder') {
      accounts.syncAccount(id)
      return { ok: true, message: `${account.platform} mock 数据已刷新。` }
    }

    try {
      const [profile, syncedItems] = await Promise.all([
        fetchAtCoderUser(account.handle),
        fetchAtCoderSubmissions(account.handle),
      ])
      const records = syncedItems.map(toSubmissionRecord)
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      atcoderSubmissions.value = records
      accounts.recordAccountSync(id, {
        handle: profile.handle,
        rating: profile.rating,
        maxRating: profile.maxRating,
        solved: acceptedProblems.size,
        lastSyncAt: formatDateTime(),
      })
      persistSubmissions()
      pushSubmissionsToServer()

      return {
        ok: true,
        message: `AtCoder 同步成功，已保存 ${records.length} 条公开提交。`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AtCoder Problems API 请求失败'
      return { ok: false, message: `AtCoder 同步失败：${message}` }
    }
  }

  async function syncLuoguAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const accounts = useAccountsStore()
    const account = accounts.accounts.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform !== 'Luogu') {
      accounts.syncAccount(id)
      return { ok: true, message: `${account.platform} mock 数据已刷新。` }
    }

    try {
      const { profile, submissions: syncedItems, tagWarning } = await fetchLuoguSyncData(
        account.handle,
      )
      const records = syncedItems.map(toSubmissionRecord)
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      luoguSubmissions.value = records
      accounts.recordAccountSync(id, {
        handle: profile.handle,
        rating: profile.rating,
        maxRating: profile.maxRating,
        solved: acceptedProblems.size,
        lastSyncAt: formatDateTime(),
      })
      persistSubmissions()
      pushSubmissionsToServer()

      const tagMessage = tagWarning ? '部分题目标签因网络波动已跳过。' : '题目标签已尽量补全。'

      return {
        ok: true,
        message: `洛谷公开练习数据同步成功，已保存 ${records.length} 条题目记录。${tagMessage}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '洛谷公开接口请求失败'
      return { ok: false, message: `洛谷同步失败：${message}` }
    }
  }

  async function syncOjAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const accounts = useAccountsStore()
    const account = accounts.accounts.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform === 'Codeforces') {
      return syncCodeforcesAccount(id)
    }

    if (account.platform === 'AtCoder') {
      return syncAtCoderAccount(id)
    }

    if (account.platform === 'Luogu') {
      return syncLuoguAccount(id)
    }

    return { ok: false, message: `${account.platform} 暂不支持同步。` }
  }

  function loadFromCache(userId: string) {
    const cached = normalizeSubmissionCache(
      readStorage<unknown>(getUserCacheKey(userId, 'submissions'), {}),
    )
    codeforcesSubmissions.value = cached.Codeforces
    atcoderSubmissions.value = cached.AtCoder
    luoguSubmissions.value = cached.Luogu
  }

  async function applyServerHydration(payload: {
    serverSubmissions: Record<string, unknown[]>
    allowLegacyMigration: boolean
    hasUserSubmissionsCache: boolean
  }) {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    const serverSubmissions = normalizeSubmissionCache(payload.serverSubmissions)
    const next =
      hasSubmissionCache(serverSubmissions) ||
      !payload.allowLegacyMigration ||
      payload.hasUserSubmissionsCache
        ? serverSubmissions
        : normalizeSubmissionCache({
            Codeforces: readStorage<SubmissionRecord[]>(storageKeys.codeforcesSubmissions, []),
            Luogu: readStorage<SubmissionRecord[]>(storageKeys.luoguSubmissions, []),
            AtCoder: readStorage<SubmissionRecord[]>(storageKeys.atcoderSubmissions, []),
          })

    codeforcesSubmissions.value = next.Codeforces
    atcoderSubmissions.value = next.AtCoder
    luoguSubmissions.value = next.Luogu
    persistSubmissions()

    if (!hasSubmissionCache(serverSubmissions) && hasSubmissionCache(next)) {
      await saveSubmissions(userId, getSubmissionCache())
    }
  }

  function resetToDefaults() {
    codeforcesSubmissions.value = []
    atcoderSubmissions.value = []
    luoguSubmissions.value = []
    persistSubmissions()
  }

  return {
    codeforcesSubmissions,
    atcoderSubmissions,
    luoguSubmissions,
    submissions,
    syncedSubmissions,
    hasSyncedSubmissions,
    analysisSubmissions,
    submissionDataSourceLabel,
    syncCodeforcesAccount,
    syncAtCoderAccount,
    syncLuoguAccount,
    syncOjAccount,
    clearSyncedSubmissions,
    persistSubmissions,
    pushSubmissionsToServer,
    loadFromCache,
    applyServerHydration,
    resetToDefaults,
  }
})

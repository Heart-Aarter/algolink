import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { fetchCodeforcesUsers } from '@/services/codeforces'
import { getLeaderboard, submitLeaderboard } from '@/services/api'
import type { LeaderboardPeriod } from '@/services/api'
import type { LeaderboardEntry } from '@/types/algolink'
import { readStorage, writeStorage } from '@/utils/storage'
import { getCodeforcesRankColor } from '@/utils/codeforcesRank'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { useAccountsStore } from './accounts'
import { avatarCacheTtlMs, defaultLeaderboard } from './shared/constants'
import { normalizeHandleKey } from './shared/format'
import { normalizeLeaderboard } from './shared/normalizers'
import { storageKeys } from './shared/storageKeys'
import type { CodeforcesAvatarCache, CodeforcesAvatarCacheEntry } from './shared/types'

export const useLeaderboardStore = defineStore('algolink/leaderboard', () => {
  const session = useSessionStore()

  const leaderboardEntries = shallowRef<LeaderboardEntry[]>(
    readStorage<LeaderboardEntry[]>(storageKeys.leaderboard, defaultLeaderboard),
  )
  const codeforcesAvatarCache = shallowRef<CodeforcesAvatarCache>(
    readStorage<CodeforcesAvatarCache>(storageKeys.codeforcesAvatars, {}),
  )
  const leaderboardCurrentUser = ref<LeaderboardEntry | null>(null)
  const leaderboardPeriod = ref<LeaderboardPeriod>('all')
  const leaderboardTotal = ref(leaderboardEntries.value.length)
  const isLeaderboardLoading = ref(false)

  function persistLeaderboard() {
    writeStorage(storageKeys.leaderboard, leaderboardEntries.value)
  }

  function persistCodeforcesAvatarCache() {
    writeStorage(storageKeys.codeforcesAvatars, codeforcesAvatarCache.value)
  }

  function getCachedCodeforcesAvatar(handle: string) {
    return codeforcesAvatarCache.value[normalizeHandleKey(handle)]
  }

  function recordCodeforcesProfile(handle: string, snapshot: CodeforcesAvatarCacheEntry) {
    codeforcesAvatarCache.value = {
      ...codeforcesAvatarCache.value,
      [normalizeHandleKey(handle)]: snapshot,
    }
    persistCodeforcesAvatarCache()
  }

  function withCodeforcesProfile(entry: LeaderboardEntry): LeaderboardEntry {
    const cached = getCachedCodeforcesAvatar(entry.username)

    return {
      ...entry,
      avatar: entry.avatar || cached?.avatar,
      displayRankColor: getCodeforcesRankColor(entry.score),
    }
  }

  async function hydrateLeaderboardAvatars(handles: string[]) {
    const now = Date.now()
    const missingHandles = [
      ...new Set(
        handles
          .map((handle) => handle.trim())
          .filter((handle) => {
            const cached = getCachedCodeforcesAvatar(handle)
            return (
              handle.length > 0 &&
              (!cached || now - new Date(cached.fetchedAt).getTime() > avatarCacheTtlMs)
            )
          }),
      ),
    ]

    if (!missingHandles.length) {
      leaderboardEntries.value = leaderboardEntries.value.map(withCodeforcesProfile)
      leaderboardCurrentUser.value = leaderboardCurrentUser.value
        ? withCodeforcesProfile(leaderboardCurrentUser.value)
        : null
      persistLeaderboard()
      return
    }

    try {
      const profiles = await fetchCodeforcesUsers(missingHandles)
      const nextCache = { ...codeforcesAvatarCache.value }

      for (const profile of profiles) {
        nextCache[normalizeHandleKey(profile.handle)] = {
          avatar: profile.avatar || '',
          rating: profile.rating,
          rank: profile.rank,
          fetchedAt: new Date().toISOString(),
        }
      }

      codeforcesAvatarCache.value = nextCache
      persistCodeforcesAvatarCache()
      leaderboardEntries.value = leaderboardEntries.value.map(withCodeforcesProfile)
      leaderboardCurrentUser.value = leaderboardCurrentUser.value
        ? withCodeforcesProfile(leaderboardCurrentUser.value)
        : null
      persistLeaderboard()
    } catch {
      leaderboardEntries.value = leaderboardEntries.value.map(withCodeforcesProfile)
      leaderboardCurrentUser.value = leaderboardCurrentUser.value
        ? withCodeforcesProfile(leaderboardCurrentUser.value)
        : null
    }
  }

  async function syncLeaderboardFromServer(period: LeaderboardPeriod = leaderboardPeriod.value) {
    isLeaderboardLoading.value = true
    const sync = useSyncStore()
    try {
      const response = await getLeaderboard({
        period,
        username: session.currentUserId ? session.currentUsername : undefined,
        limit: 100,
      })
      const serverItems = normalizeLeaderboard(response.items)
      const currentUser =
        normalizeLeaderboard(response.currentUser ? [response.currentUser] : [])[0] ?? null

      leaderboardEntries.value = serverItems
      persistLeaderboard()
      leaderboardCurrentUser.value = currentUser
      leaderboardPeriod.value = response.period
      leaderboardTotal.value = response.total
      void hydrateLeaderboardAvatars([
        ...serverItems.map((entry) => entry.username),
        currentUser?.username ?? '',
      ])
      sync.serverSyncMessage = ''
    } catch {
      void hydrateLeaderboardAvatars(leaderboardEntries.value.map((entry) => entry.username))
      sync.serverSyncMessage = 'Server unavailable. Showing local cache.'
    } finally {
      isLeaderboardLoading.value = false
    }
  }

  function pushLeaderboardScore(username: string, score: number, eventId: string, date: string) {
    if (!session.currentUserId || username !== session.currentUsername) {
      return
    }

    submitLeaderboard({
      username,
      score,
      eventId,
      source: 'daily-challenge',
      date,
    })
      .then(() => {
        useSyncStore().serverSyncMessage = ''
        void syncLeaderboardFromServer(leaderboardPeriod.value)
      })
      .catch(() => {
        useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
      })
  }

  function addLeaderboardScore(username: string, score: number, eventId: string, date: string) {
    if (!session.currentUserId || username !== session.currentUsername) {
      return
    }

    const existing = leaderboardEntries.value.find((entry) => entry.username === username)

    if (existing) {
      leaderboardEntries.value = leaderboardEntries.value.map((entry) =>
        entry.username === username ? { ...entry, score: entry.score + score } : entry,
      )
    } else {
      leaderboardEntries.value = [...leaderboardEntries.value, { username, score }]
    }

    persistLeaderboard()
    pushLeaderboardScore(username, score, eventId, date)
  }

  function loadLeaderboardPeriod(period: LeaderboardPeriod) {
    return syncLeaderboardFromServer(period)
  }

  const leaderboard = computed(() => {
    const board = new Map<string, LeaderboardEntry>()

    for (const entry of leaderboardEntries.value) {
      const cached = getCachedCodeforcesAvatar(entry.username)
      const existing = board.get(entry.username)
      const score = Math.max(existing?.score ?? 0, entry.score)
      board.set(entry.username, {
        ...existing,
        ...entry,
        score,
        avatar: entry.avatar || cached?.avatar || existing?.avatar,
        displayRankColor: getCodeforcesRankColor(score),
      })
    }

    if (leaderboardCurrentUser.value?.username) {
      const cached = getCachedCodeforcesAvatar(leaderboardCurrentUser.value.username)
      const existing = board.get(leaderboardCurrentUser.value.username)
      const score = Math.max(existing?.score ?? 0, leaderboardCurrentUser.value.score)
      board.set(leaderboardCurrentUser.value.username, {
        ...existing,
        ...leaderboardCurrentUser.value,
        score,
        avatar: leaderboardCurrentUser.value.avatar || cached?.avatar || existing?.avatar,
        displayRankColor: getCodeforcesRankColor(score),
      })
    }

    if (
      session.currentUserId &&
      session.currentUsername &&
      !board.has(session.currentUsername)
    ) {
      const cached = getCachedCodeforcesAvatar(session.currentUsername)
      board.set(session.currentUsername, {
        username: session.currentUsername,
        score: 0,
        avatar: cached?.avatar,
        isCurrentUser: true,
        displayRankColor: getCodeforcesRankColor(0),
      })
    }

    return [...board.values()].sort(
      (left, right) => right.score - left.score || left.username.localeCompare(right.username),
    )
  })

  const currentLeaderboardUser = computed(() => {
    if (!session.currentUserId || !session.currentUsername) {
      return null
    }

    const current = leaderboard.value.find((entry) => entry.username === session.currentUsername)
    if (!current) {
      return null
    }

    const serverCurrent =
      leaderboardCurrentUser.value?.username === session.currentUsername
        ? leaderboardCurrentUser.value
        : null
    const localRank = leaderboard.value.findIndex((entry) => entry.username === current.username) + 1
    const rank = serverCurrent?.rank ?? localRank
    const previous = leaderboard.value[localRank - 2]

    return {
      ...current,
      rank,
      gapToPrevious:
        serverCurrent?.gapToPrevious ?? (previous ? Math.max(previous.score - current.score, 0) : 0),
    }
  })

  const currentUserAvatar = computed(() => {
    const accounts = useAccountsStore()
    return (
      accounts.codeforcesAccount?.avatar ||
      getCachedCodeforcesAvatar(session.currentUsername)?.avatar ||
      currentLeaderboardUser.value?.avatar ||
      ''
    )
  })

  function resetToDefaults() {
    leaderboardEntries.value = defaultLeaderboard
    persistLeaderboard()
  }

  return {
    leaderboardEntries,
    leaderboardCurrentUser,
    leaderboardPeriod,
    leaderboardTotal,
    isLeaderboardLoading,
    codeforcesAvatarCache,
    leaderboard,
    currentLeaderboardUser,
    currentUserAvatar,
    syncLeaderboardFromServer,
    loadLeaderboardPeriod,
    addLeaderboardScore,
    hydrateLeaderboardAvatars,
    pushLeaderboardScore,
    recordCodeforcesProfile,
    getCachedCodeforcesAvatar,
    resetToDefaults,
  }
})

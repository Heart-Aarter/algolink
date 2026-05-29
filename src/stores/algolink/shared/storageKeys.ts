export const storageKeys = {
  currentUserId: 'algolink:currentUserId',
  currentUsername: 'algolink:currentUsername',
  sessionToken: 'algolink:sessionToken',
  sessionExpiresAt: 'algolink:sessionExpiresAt',
  accounts: 'algolink.accounts',
  settings: 'algolink.settings',
  tasks: 'algolink.trainingTasks',
  weeklyPlanDays: 'algolink.weeklyPlanDays',
  weeklyPlanStatus: 'algolink.weeklyPlanStatus',
  codeforcesSubmissions: 'algolink.codeforcesSubmissions',
  atcoderSubmissions: 'algolink.atcoderSubmissions',
  luoguSubmissions: 'algolink.luoguSubmissions',
  dailyChallenge: 'algolink.dailyChallenge',
  leaderboard: 'algolink.leaderboard',
  codeforcesAvatars: 'algolink.cfAvatars',
} as const

export function getUserCacheKey(userId: string, key: string) {
  return `algolink:${userId}:${key}`
}

export function hasStorageValue(key: string) {
  return localStorage.getItem(key) !== null
}

export function resolveKey(userId: string, legacyKey: string, perUserKey: string) {
  return userId ? getUserCacheKey(userId, perUserKey) : legacyKey
}

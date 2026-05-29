import { defineStore, storeToRefs } from 'pinia'
import { useAccountsStore } from './algolink/accounts'
import { useAiAdviceStore } from './algolink/aiAdvice'
import { useDailyChallengeStore } from './algolink/dailyChallenge'
import { useLeaderboardStore } from './algolink/leaderboard'
import { useSessionStore } from './algolink/session'
import { useSettingsStore } from './algolink/settings'
import { useSubmissionsStore } from './algolink/submissions'
import { useSyncStore } from './algolink/sync'
import { useTrainingStore } from './algolink/training'
import { supportedPlatforms } from './algolink/shared/constants'

export { supportedPlatforms }

export const useAlgoLinkStore = defineStore('algolink', () => {
  const session = useSessionStore()
  const accounts = useAccountsStore()
  const submissions = useSubmissionsStore()
  const settings = useSettingsStore()
  const training = useTrainingStore()
  const daily = useDailyChallengeStore()
  const aiAdvice = useAiAdviceStore()
  const leaderboard = useLeaderboardStore()
  const sync = useSyncStore()

  session.registerUnauthorizedHandler(() => sync.handleUnauthorized())
  sync.startBackgroundBootstrap()

  const sessionRefs = storeToRefs(session)
  const accountRefs = storeToRefs(accounts)
  const submissionRefs = storeToRefs(submissions)
  const settingsRefs = storeToRefs(settings)
  const trainingRefs = storeToRefs(training)
  const dailyRefs = storeToRefs(daily)
  const aiAdviceRefs = storeToRefs(aiAdvice)
  const leaderboardRefs = storeToRefs(leaderboard)
  const syncRefs = storeToRefs(sync)

  async function loginSimpleUser(username: string, password: string) {
    const result = await session.loginSimpleUser(username, password)
    if (result.ok) {
      await sync.bootstrapAfterLogin(result.previousUserId)
    }
    return { ok: result.ok, message: result.message }
  }

  return {
    sessionToken: sessionRefs.sessionToken,
    sessionExpiresAt: sessionRefs.sessionExpiresAt,
    currentUserId: sessionRefs.currentUserId,
    currentUsername: sessionRefs.currentUsername,
    accounts: accountRefs.accounts,
    codeforcesAccount: accountRefs.codeforcesAccount,
    platformSyncCards: accountRefs.platformSyncCards,
    submissions: submissionRefs.submissions,
    syncedSubmissions: submissionRefs.syncedSubmissions,
    hasSyncedSubmissions: submissionRefs.hasSyncedSubmissions,
    analysisSubmissions: submissionRefs.analysisSubmissions,
    submissionDataSourceLabel: submissionRefs.submissionDataSourceLabel,
    settings: settingsRefs.settings,
    hasAiApiKey: settingsRefs.hasAiApiKey,
    trainingTasks: trainingRefs.trainingTasks,
    weeklyPlanDays: trainingRefs.weeklyPlanDays,
    weeklyPlanCompletion: trainingRefs.weeklyPlanCompletion,
    activePlanCount: trainingRefs.activePlanCount,
    dailyChallenge: dailyRefs.dailyChallenge,
    aiAdvice: aiAdviceRefs.aiAdvice,
    aiAdviceGeneratedAt: aiAdviceRefs.aiAdviceGeneratedAt,
    leaderboard: leaderboardRefs.leaderboard,
    currentLeaderboardUser: leaderboardRefs.currentLeaderboardUser,
    currentUserAvatar: leaderboardRefs.currentUserAvatar,
    leaderboardPeriod: leaderboardRefs.leaderboardPeriod,
    leaderboardTotal: leaderboardRefs.leaderboardTotal,
    isLeaderboardLoading: leaderboardRefs.isLeaderboardLoading,
    serverSyncMessage: syncRefs.serverSyncMessage,
    supportedPlatforms,

    loginSimpleUser,
    logout: session.logout,
    bindAccount: accounts.bindAccount,
    removeAccount: accounts.removeAccount,
    syncOjAccount: submissions.syncOjAccount,
    loadLeaderboardPeriod: leaderboard.loadLeaderboardPeriod,
    loadDailyChallenge: daily.loadDailyChallenge,
    verifyAndCompleteDailyProblem: daily.verifyAndCompleteDailyProblem,
    updateSettings: settings.updateSettings,
    saveStoredAiApiKey: settings.saveStoredAiApiKey,
    clearStoredAiApiKey: settings.clearStoredAiApiKey,
    saveAiAdviceToServer: aiAdvice.saveAiAdviceToServer,
    updateWeeklyPlanStatus: training.updateWeeklyPlanStatus,
    addWeeklyPlanDay: training.addWeeklyPlanDay,
    resetLocalData: sync.resetLocalData,
  }
})

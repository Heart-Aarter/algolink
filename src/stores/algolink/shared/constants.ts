import type { OjPlatform, AiProvider, LeaderboardEntry } from '@/types/algolink'

export const supportedPlatforms: OjPlatform[] = ['Codeforces', 'Luogu', 'AtCoder']

export const platformColors: Record<OjPlatform, string> = {
  Codeforces: '#8cab9f',
  Luogu: '#8f9f79',
  AtCoder: '#c28a2e',
}

export const autoSyncIntervalMs = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
} as const

export const autoSyncCheckMs = 60 * 60 * 1000

export const avatarCacheTtlMs = 24 * 60 * 60 * 1000

export const defaultLeaderboard: LeaderboardEntry[] = []

export const supportedAiProviders: AiProvider[] = ['openai-compatible', 'deepseek']

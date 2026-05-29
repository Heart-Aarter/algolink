import type { UserSettings } from '@/types/algolink'

export function formatDateTime(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function parseSyncTime(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

export function getCodeforcesRatingSnapshot(
  profile: { rating: number; maxRating: number },
  ratingChanges: { newRating: number }[],
) {
  const historyMaxRating = ratingChanges.reduce(
    (maxRating, change) => Math.max(maxRating, change.newRating),
    0,
  )

  return {
    rating: profile.rating,
    maxRating: Math.max(profile.maxRating, historyMaxRating, profile.rating),
  }
}

export function normalizeHandleKey(handle: string) {
  return handle.trim().toLowerCase()
}

export function getServerSafeSettings(value: UserSettings) {
  const { aiApiKey: _aiApiKey, ...settings } = value
  return settings
}

export function isSessionActive(expiresAt: string) {
  return Boolean(expiresAt) && new Date(expiresAt).getTime() > Date.now()
}

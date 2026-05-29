import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveAiAdvice as saveSavedAiAdvice } from '@/services/api'
import type { AiAdviceResponse } from '@/types/algolink'
import { readStorage, writeStorage } from '@/utils/storage'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { getUserCacheKey } from './shared/storageKeys'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeAiAdvicePayload(
  value: unknown,
  generatedAt: string | null,
): { advice: AiAdviceResponse | null; generatedAt: string } {
  if (isRecord(value) && 'advice' in value) {
    return {
      advice: (value.advice as AiAdviceResponse | null) ?? null,
      generatedAt:
        generatedAt ?? (typeof value.generatedAt === 'string' ? value.generatedAt : ''),
    }
  }

  return {
    advice: (value as AiAdviceResponse | null) ?? null,
    generatedAt: generatedAt ?? '',
  }
}

export const useAiAdviceStore = defineStore('algolink/aiAdvice', () => {
  const session = useSessionStore()
  const initialUserId = session.currentUserId

  const aiAdvice = ref<AiAdviceResponse | null>(
    initialUserId
      ? readStorage<AiAdviceResponse | null>(getUserCacheKey(initialUserId, 'aiAdvice'), null)
      : null,
  )
  const aiAdviceGeneratedAt = ref(
    initialUserId
      ? readStorage<string>(getUserCacheKey(initialUserId, 'aiAdviceGeneratedAt'), '')
      : '',
  )

  function persistAiAdvice() {
    const userId = session.currentUserId
    if (!userId) {
      return
    }
    writeStorage(getUserCacheKey(userId, 'aiAdvice'), aiAdvice.value)
    writeStorage(getUserCacheKey(userId, 'aiAdviceGeneratedAt'), aiAdviceGeneratedAt.value)
  }

  async function saveAiAdviceToServer() {
    const userId = session.currentUserId
    if (!userId) {
      persistAiAdvice()
      return
    }

    try {
      await saveSavedAiAdvice(userId, aiAdvice.value)
      persistAiAdvice()
      useSyncStore().serverSyncMessage = ''
    } catch {
      persistAiAdvice()
      useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
    }
  }

  function loadFromCache(userId: string) {
    aiAdvice.value = readStorage<AiAdviceResponse | null>(getUserCacheKey(userId, 'aiAdvice'), null)
    aiAdviceGeneratedAt.value = readStorage<string>(
      getUserCacheKey(userId, 'aiAdviceGeneratedAt'),
      '',
    )
  }

  function applyServerHydration(payload: {
    aiAdvice: unknown
    aiAdviceGeneratedAt: string | null
    hasUserAiAdviceCache: boolean
  }) {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    if (payload.aiAdvice) {
      const normalized = normalizeAiAdvicePayload(payload.aiAdvice, payload.aiAdviceGeneratedAt)
      aiAdvice.value = normalized.advice
      aiAdviceGeneratedAt.value = normalized.generatedAt
    } else if (payload.hasUserAiAdviceCache) {
      const userAiAdviceKey = getUserCacheKey(userId, 'aiAdvice')
      aiAdvice.value = readStorage<AiAdviceResponse | null>(userAiAdviceKey, null)
      aiAdviceGeneratedAt.value = readStorage<string>(
        getUserCacheKey(userId, 'aiAdviceGeneratedAt'),
        '',
      )
    } else {
      aiAdvice.value = null
      aiAdviceGeneratedAt.value = ''
    }
    persistAiAdvice()
  }

  function resetToDefaults() {
    aiAdvice.value = null
    aiAdviceGeneratedAt.value = ''
  }

  return {
    aiAdvice,
    aiAdviceGeneratedAt,
    saveAiAdviceToServer,
    persistAiAdvice,
    loadFromCache,
    applyServerHydration,
    resetToDefaults,
  }
})

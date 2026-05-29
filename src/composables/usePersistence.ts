import { resolveKey } from '@/stores/algolink/shared/storageKeys'
import { writeStorage } from '@/utils/storage'

interface PersistenceOptions<TValue, TServerPayload = TValue> {
  legacyKey: string
  perUserKey: string
  serialize?: (value: TValue) => TServerPayload
  push?: (userId: string, payload: TServerPayload) => Promise<unknown>
  onPushSuccess?: (response: unknown) => void
  onPushError?: (error: unknown) => void
}

export interface PersistenceHandle<TValue> {
  persist(userId: string, value: TValue): void
  pushToServer(userId: string, value: TValue): void
}

export function usePersistence<TValue, TServerPayload = TValue>(
  options: PersistenceOptions<TValue, TServerPayload>,
): PersistenceHandle<TValue> {
  const serialize = options.serialize ?? ((value) => value as unknown as TServerPayload)

  return {
    persist(userId, value) {
      writeStorage(resolveKey(userId, options.legacyKey, options.perUserKey), value)
    },
    pushToServer(userId, value) {
      if (!userId || !options.push) {
        return
      }

      options
        .push(userId, serialize(value))
        .then((response) => {
          options.onPushSuccess?.(response)
        })
        .catch((error) => {
          options.onPushError?.(error)
        })
    },
  }
}

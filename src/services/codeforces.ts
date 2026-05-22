import axios from 'axios'
import type { OjProfile, OjRatingChange, OjSubmission } from './ojTypes'
import {
  normalizeCodeforcesRating,
  normalizeCodeforcesSubmission,
  normalizeCodeforcesUser,
  type CodeforcesRatingChange,
  type CodeforcesSubmission,
  type CodeforcesUserInfo,
} from './normalizers'

const codeforcesClient = axios.create({
  baseURL: 'https://codeforces.com/api',
  timeout: 10000,
})

const requestIntervalMs = 2000
const lastRequestAt = new Map<string, number>()

interface CodeforcesApiResponse<T> {
  status: 'OK' | 'FAILED'
  comment?: string
  result: T
}

async function waitForThrottle(key: string) {
  const now = Date.now()
  const lastTime = lastRequestAt.get(key) ?? 0
  const waitMs = requestIntervalMs - (now - lastTime)

  if (waitMs > 0) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, waitMs))
  }

  lastRequestAt.set(key, Date.now())
}

async function requestCodeforces<T>(
  method: string,
  params: Record<string, string | number>,
  throttleKey: string,
) {
  await waitForThrottle(`${method}:${throttleKey.toLowerCase()}`)

  try {
    const response = await codeforcesClient.get<CodeforcesApiResponse<T>>(`/${method}`, { params })

    if (response.data.status !== 'OK') {
      throw new Error(response.data.comment || 'Codeforces API request failed')
    }

    return response.data.result
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage = (error.response?.data as { comment?: string } | undefined)?.comment
      throw new Error(apiMessage || error.message || 'Codeforces API request failed')
    }

    throw error
  }
}

export async function fetchCodeforcesUser(handle: string): Promise<OjProfile> {
  const normalizedHandle = handle.trim()
  const result = await requestCodeforces<CodeforcesUserInfo[]>(
    'user.info',
    {
      handles: normalizedHandle,
    },
    normalizedHandle,
  )
  const user = result[0]

  if (!user) {
    throw new Error(`Codeforces user "${normalizedHandle}" not found`)
  }

  return normalizeCodeforcesUser(user)
}

export async function fetchCodeforcesUsers(handles: string[]): Promise<OjProfile[]> {
  const normalizedHandles = [
    ...new Set(handles.map((h) => h.trim()).filter((handle) => handle.length > 0)),
  ]

  if (!normalizedHandles.length) {
    return []
  }

  let result: CodeforcesUserInfo[]

  try {
    result = await requestCodeforces<CodeforcesUserInfo[]>(
      'user.info',
      {
        handles: normalizedHandles.join(';'),
      },
      normalizedHandles.join(';'),
    )
  } catch (error) {
    if (normalizedHandles.length === 1) {
      throw error
    }

    const profiles = await Promise.allSettled(
      normalizedHandles.map((handle) => fetchCodeforcesUser(handle)),
    )

    return profiles
      .filter((profile): profile is PromiseFulfilledResult<OjProfile> => profile.status === 'fulfilled')
      .map((profile) => profile.value)
  }

  return result.map(normalizeCodeforcesUser)
}

export async function fetchCodeforcesRating(handle: string): Promise<OjRatingChange[]> {
  const normalizedHandle = handle.trim()
  const result = await requestCodeforces<CodeforcesRatingChange[]>(
    'user.rating',
    {
      handle: normalizedHandle,
    },
    normalizedHandle,
  )

  return result.map(normalizeCodeforcesRating)
}

export async function fetchCodeforcesSubmissions(
  handle: string,
  count?: number,
): Promise<OjSubmission[]> {
  const normalizedHandle = handle.trim()
  const params: Record<string, string | number> = {
    handle: normalizedHandle,
    from: 1,
  }

  if (typeof count === 'number' && count > 0) {
    params.count = count
  }

  const result = await requestCodeforces<CodeforcesSubmission[]>(
    'user.status',
    params,
    normalizedHandle,
  )

  return result.map(normalizeCodeforcesSubmission)
}

export async function hasRecentCodeforcesBindingCe(handle: string): Promise<boolean> {
  const normalizedHandle = handle.trim()
  const tenMinutesAgoSeconds = Math.floor(Date.now() / 1000) - 10 * 60
  const result = await requestCodeforces<CodeforcesSubmission[]>(
    'user.status',
    {
      handle: normalizedHandle,
      from: 1,
      count: 20,
    },
    `${normalizedHandle}:binding`,
  )

  return result.some(
    (submission) =>
      submission.creationTimeSeconds >= tenMinutesAgoSeconds &&
      submission.verdict === 'COMPILATION_ERROR' &&
      submission.problem.contestId === 1 &&
      submission.problem.index.toUpperCase() === 'A',
  )
}

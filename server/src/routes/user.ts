import { Router } from 'express'
import { getDatabase } from '../db.js'

const router = Router()
const usernamePattern = /^[A-Za-z0-9_-]{1,32}$/
const defaultSubmissions = {
  Codeforces: [],
  Luogu: [],
  AtCoder: [],
}

type UserRow = {
  id: string
}

type AccountsRow = {
  data: string
}

type SubmissionRow = {
  platform: string
  data: string
}

type StateRow = {
  settings: string | null
  training_plan: string | null
  daily_challenge: string | null
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

router.post('/', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''

  if (!usernamePattern.test(username)) {
    return res.status(400).json({
      error: 'username must be 1-32 characters and contain only letters, numbers, underscores, or hyphens',
    })
  }

  const db = getDatabase()
  const created = new Date().toISOString()

  db.prepare('INSERT OR IGNORE INTO users (id, created) VALUES (?, ?)').run(username, created)

  return res.json({
    userId: username,
    username,
  })
})

router.get('/:userId', (req, res) => {
  const userId = req.params.userId
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  const accountsRow = db
    .prepare('SELECT data FROM user_accounts WHERE user_id = ?')
    .get(userId) as AccountsRow | undefined
  const submissionRows = db
    .prepare('SELECT platform, data FROM user_submissions WHERE user_id = ?')
    .all(userId) as SubmissionRow[]
  const stateRow = db
    .prepare('SELECT settings, training_plan, daily_challenge FROM user_state WHERE user_id = ?')
    .get(userId) as StateRow | undefined
  const submissions: Record<string, unknown[]> = {
    ...defaultSubmissions,
  }

  for (const row of submissionRows) {
    submissions[row.platform] = parseJson<unknown[]>(row.data, [])
  }

  return res.json({
    userId,
    accounts: parseJson<unknown[]>(accountsRow?.data, []),
    submissions,
    settings: parseJson<unknown | null>(stateRow?.settings, null),
    trainingPlan: parseJson<unknown | null>(stateRow?.training_plan, null),
    dailyChallenge: parseJson<unknown | null>(stateRow?.daily_challenge, null),
  })
})

export default router

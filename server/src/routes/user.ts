import { Router } from 'express'
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { getDatabase } from '../db'

const router = Router()
const usernamePattern = /^[A-Za-z0-9_-]{1,32}$/
const passwordPattern = /^.{6,64}$/
const passwordKeyLength = 32
const passwordIterations = 120000
const passwordDigest = 'sha256'
const defaultSubmissions = {
  Codeforces: [],
  Luogu: [],
  AtCoder: [],
}

type UserRow = {
  id: string
  password_hash: string | null
  password_salt: string | null
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

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(
    password,
    salt,
    passwordIterations,
    passwordKeyLength,
    passwordDigest,
  ).toString('hex')

  return { hash, salt }
}

function verifyPassword(password: string, expectedHash: string, salt: string) {
  const { hash } = hashPassword(password, salt)
  const actual = Buffer.from(hash, 'hex')
  const expected = Buffer.from(expectedHash, 'hex')

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

router.post('/', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!usernamePattern.test(username)) {
    return res.status(400).json({
      error: 'username must be 1-32 characters and contain only letters, numbers, underscores, or hyphens',
    })
  }

  if (!passwordPattern.test(password)) {
    return res.status(400).json({ error: 'password must be 6-64 characters' })
  }

  const db = getDatabase()
  const existingUser = db
    .prepare('SELECT id, password_hash, password_salt FROM users WHERE id = ?')
    .get(username) as UserRow | undefined

  if (existingUser?.password_hash && existingUser.password_salt) {
    if (!verifyPassword(password, existingUser.password_hash, existingUser.password_salt)) {
      return res.status(401).json({ error: 'invalid username or password' })
    }
  } else {
    const { hash, salt } = hashPassword(password)

    if (existingUser) {
      db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(
        hash,
        salt,
        username,
      )
    } else {
      db.prepare(
        'INSERT INTO users (id, password_hash, password_salt) VALUES (?, ?, ?)',
      ).run(username, hash, salt)
    }
  }

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

import { Router } from 'express'
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { getDatabase } from '../db'
import { hashSessionToken, requireUser } from '../middleware'
import { isValidUsername, usernamePattern } from '../singleUser'

const router = Router()
const passwordPattern = /^.{6,64}$/
const passwordKeyLength = 32
const passwordIterations = 120000
const passwordDigest = 'sha256'
const sessionTtlMs = 30 * 24 * 60 * 60 * 1000
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
  ai_advice: string | null
  ai_advice_generated_at: string | null
}

type SecretRow = {
  ai_api_key_ciphertext: string | null
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

function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString()
  const db = getDatabase()

  db.prepare('DELETE FROM user_sessions WHERE expires_at <= ?').run(new Date().toISOString())
  db.prepare(
    `
      INSERT INTO user_sessions (token_hash, user_id, expires_at)
      VALUES (?, ?, ?)
    `,
  ).run(hashSessionToken(token), userId, expiresAt)

  return { token, expiresAt }
}

function sanitizeSettings(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  const { aiApiKey: _aiApiKey, ...settings } = value as Record<string, unknown>
  return settings
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
        'INSERT INTO users (id, password_hash, password_salt, created) VALUES (?, ?, ?, ?)',
      ).run(username, hash, salt, new Date().toISOString())
    }
  }

  const session = createSession(username)

  return res.json({
    userId: username,
    username,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt,
  })
})

router.get('/:userId', requireUser, (req, res) => {
  const userId = typeof req.params.userId === 'string' ? req.params.userId : ''

  if (!isValidUsername(userId)) {
    return res.status(404).json({ error: 'user not found' })
  }

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
    .prepare('SELECT settings, training_plan, daily_challenge, ai_advice, ai_advice_generated_at FROM user_state WHERE user_id = ?')
    .get(userId) as StateRow | undefined
  const secretRow = db
    .prepare('SELECT ai_api_key_ciphertext FROM user_secrets WHERE user_id = ?')
    .get(userId) as SecretRow | undefined
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
    settings: sanitizeSettings(parseJson<unknown | null>(stateRow?.settings, null)),
    hasAiApiKey: Boolean(secretRow?.ai_api_key_ciphertext),
    trainingPlan: parseJson<unknown | null>(stateRow?.training_plan, null),
    dailyChallenge: parseJson<unknown | null>(stateRow?.daily_challenge, null),
    aiAdvice: parseJson<unknown | null>(stateRow?.ai_advice, null),
    aiAdviceGeneratedAt: stateRow?.ai_advice_generated_at ?? null,
  })
})

export default router

import type { RequestHandler } from 'express'
import { createHash } from 'node:crypto'
import { getDatabase, type UserRow } from './db'
import { isValidUsername } from './singleUser'

declare global {
  namespace Express {
    interface Request {
      authUserId?: string
    }
  }
}

type SessionRow = {
  user_id: string
  expires_at: string
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function getBearerToken(value: string | undefined) {
  if (!value) {
    return ''
  }

  const [scheme, token] = value.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : ''
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = getBearerToken(req.get('authorization'))

  if (!token) {
    return res.status(401).json({ error: 'login required' })
  }

  const db = getDatabase()
  const tokenHash = hashSessionToken(token)
  const session = db
    .prepare(
      `
        SELECT user_id, expires_at
        FROM user_sessions
        WHERE token_hash = ?
      `,
    )
    .get(tokenHash) as SessionRow | undefined

  if (!session) {
    return res.status(401).json({ error: 'login required' })
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash)
    return res.status(401).json({ error: 'session expired' })
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(session.user_id) as
    | UserRow
    | undefined

  if (!user) {
    return res.status(401).json({ error: 'login required' })
  }

  req.authUserId = user.id
  next()
}

export const requireUser: RequestHandler = (req, res, next) => {
  const userId = typeof req.params.userId === 'string' ? req.params.userId : ''

  if (!isValidUsername(userId)) {
    return res.status(404).json({ error: 'user not found' })
  }

  return requireAuth(req, res, () => {
    if (req.authUserId !== userId) {
      return res.status(403).json({ error: 'forbidden' })
    }

    const db = getDatabase()
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

    if (!user) {
      return res.status(404).json({ error: 'user not found' })
    }

    next()
  })
}

import type { RequestHandler } from 'express'
import { getDatabase, type UserRow } from './db'
import { isAllowedUsername } from './singleUser'

export const requireUser: RequestHandler = (req, res, next) => {
  const userId = typeof req.params.userId === 'string' ? req.params.userId : ''

  if (!isAllowedUsername(userId)) {
    return res.status(404).json({ error: 'user not found' })
  }

  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  next()
}

import type { RequestHandler } from 'express'
import { getDatabase, type UserRow } from './db'

export const requireUser: RequestHandler = (req, res, next) => {
  const userId = req.params.userId
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  next()
}

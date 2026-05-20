import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'

const router = Router()

router.put('/:userId/accounts', requireUser, (req, res) => {
  const userId = req.params.userId
  const accounts = req.body?.accounts
  const db = getDatabase()

  if (!Array.isArray(accounts)) {
    return res.status(400).json({ error: 'accounts must be an array' })
  }

  db.prepare(
    `
      INSERT INTO user_accounts (user_id, data)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET data = excluded.data
    `,
  ).run(userId, JSON.stringify(accounts))

  return res.json({ userId, accounts })
})

export default router

import { Router } from 'express'
import { getDatabase } from '../db.js'

const router = Router()

type UserRow = {
  id: string
}

router.put('/:userId/accounts', (req, res) => {
  const userId = req.params.userId
  const accounts = req.body?.accounts
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

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

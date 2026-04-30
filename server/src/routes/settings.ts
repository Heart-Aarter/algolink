import { Router } from 'express'
import { getDatabase } from '../db.js'

const router = Router()

type UserRow = {
  id: string
}

router.put('/:userId/settings', (req, res) => {
  const userId = req.params.userId
  const settings = req.body?.settings
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  db.prepare(
    `
      INSERT INTO user_state (user_id, settings)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET settings = excluded.settings
    `,
  ).run(userId, JSON.stringify(settings))

  return res.json({ userId, settings })
})

export default router

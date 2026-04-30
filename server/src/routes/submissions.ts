import { Router } from 'express'
import { getDatabase } from '../db'

const router = Router()

type UserRow = {
  id: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

router.put('/:userId/submissions', (req, res) => {
  const userId = req.params.userId
  const submissions = req.body?.submissions
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  if (!isPlainObject(submissions)) {
    return res.status(400).json({ error: 'submissions must be an object' })
  }

  const upsertSubmission = db.prepare(`
    INSERT INTO user_submissions (user_id, platform, data)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, platform) DO UPDATE SET data = excluded.data
  `)
  const saveSubmissions = db.transaction((items: [string, unknown][]) => {
    for (const [platform, data] of items) {
      upsertSubmission.run(userId, platform, JSON.stringify(data))
    }
  })

  saveSubmissions(Object.entries(submissions))

  return res.json({ userId, submissions })
})

export default router

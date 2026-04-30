import { Router } from 'express'
import { getDatabase } from '../db.js'

const router = Router()
const usernamePattern = /^[A-Za-z0-9_-]{1,32}$/

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

export default router

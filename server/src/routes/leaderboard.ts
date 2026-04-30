import { Router } from 'express'
import { getDatabase } from '../db.js'

const router = Router()

type LeaderboardRow = {
  username: string
  score: number
}

function isValidUsername(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

router.get('/', (_req, res) => {
  const db = getDatabase()
  const items = db
    .prepare('SELECT username, score FROM leaderboard ORDER BY score DESC, username ASC LIMIT 100')
    .all() as LeaderboardRow[]

  return res.json({ items })
})

router.post('/', (req, res) => {
  const username = isValidUsername(req.body?.username) ? req.body.username.trim() : ''
  const score = req.body?.score

  if (!username) {
    return res.status(400).json({ error: 'username is required' })
  }

  if (!isNonNegativeInteger(score)) {
    return res.status(400).json({ error: 'score must be a non-negative integer' })
  }

  const db = getDatabase()

  db.prepare(
    `
      INSERT INTO leaderboard (username, score)
      VALUES (?, ?)
      ON CONFLICT(username) DO UPDATE SET score = leaderboard.score + excluded.score
    `,
  ).run(username, score)

  return res.json({ username, score })
})

export default router

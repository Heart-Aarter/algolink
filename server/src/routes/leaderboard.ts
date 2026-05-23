import { Router } from 'express'
import { getDatabase } from '../db'
import { isValidUsername } from '../singleUser'

const router = Router()

type LeaderboardRow = {
  username: string
  score: number
}

type LeaderboardItem = LeaderboardRow & {
  rank: number
  isCurrentUser: boolean
  gapToPrevious?: number
}

type LeaderboardPeriod = 'all' | 'today' | 'week' | 'streak'

function isValidUsernameValue(value: unknown): value is string {
  return typeof value === 'string' && isValidUsername(value.trim())
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isValidEventId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 160
}

function normalizePeriod(value: unknown): LeaderboardPeriod {
  return value === 'today' || value === 'week' || value === 'streak' ? value : 'all'
}

function normalizePositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(parsed, max)
}

function normalizeOffset(value: unknown) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function formatDateKey(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatWeekStartKey(date = new Date()) {
  const current = new Date(date)
  const day = current.getDay() || 7
  current.setDate(current.getDate() - day + 1)
  return formatDateKey(current)
}

function isValidDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function getEventDate(value: unknown) {
  return isValidDateKey(value) ? value : formatDateKey()
}

function rankRows(rows: LeaderboardRow[], currentUsername: string): LeaderboardItem[] {
  let currentRank = 0
  let prevScore: number | undefined

  return rows.map((row, index) => {
    if (row.score !== prevScore) {
      currentRank = index + 1
    }
    prevScore = row.score

    return {
      ...row,
      rank: currentRank,
      isCurrentUser: row.username === currentUsername,
    }
  })
}

function getRankedRows(period: LeaderboardPeriod) {
  const db = getDatabase()

  if (period === 'today') {
    return db
      .prepare(
        `
          SELECT username, SUM(score_delta) AS score
          FROM leaderboard_events
          WHERE event_date = ?
          GROUP BY username
          HAVING score > 0
          ORDER BY score DESC, username ASC
        `,
      )
      .all(formatDateKey()) as LeaderboardRow[]
  }

  if (period === 'week') {
    return db
      .prepare(
        `
          SELECT username, SUM(score_delta) AS score
          FROM leaderboard_events
          WHERE event_date >= ?
          GROUP BY username
          HAVING score > 0
          ORDER BY score DESC, username ASC
        `,
      )
      .all(formatWeekStartKey()) as LeaderboardRow[]
  }

  if (period === 'streak') {
    const eventRows = db
      .prepare(
        `
          SELECT username, event_date
          FROM leaderboard_events
          WHERE score_delta > 0
          GROUP BY username, event_date
          ORDER BY username ASC, event_date DESC
        `,
      )
      .all() as { username: string; event_date: string }[]

    const datesByUser = new Map<string, Set<string>>()
    for (const row of eventRows) {
      const dates = datesByUser.get(row.username) ?? new Set<string>()
      dates.add(row.event_date)
      datesByUser.set(row.username, dates)
    }

    const today = new Date()
    const rows: LeaderboardRow[] = []

    for (const [username, dates] of datesByUser.entries()) {
      let score = 0
      const cursor = new Date(today)

      while (dates.has(formatDateKey(cursor))) {
        score += 1
        cursor.setDate(cursor.getDate() - 1)
      }

      if (score > 0) {
        rows.push({ username, score })
      }
    }

    return rows.sort((left, right) => right.score - left.score || left.username.localeCompare(right.username))
  }

  return db
    .prepare('SELECT username, score FROM leaderboard ORDER BY score DESC, username ASC')
    .all() as LeaderboardRow[]
}

router.get('/', (req, res) => {
  const period = normalizePeriod(req.query.period)
  const limit = normalizePositiveInteger(req.query.limit, 100, 500)
  const offset = normalizeOffset(req.query.offset)
  const requestedUsername = typeof req.query.username === 'string' ? req.query.username.trim() : ''
  const currentUsername = isValidUsername(requestedUsername) ? requestedUsername : ''
  const rankedRows = rankRows(getRankedRows(period), currentUsername)
  const items = rankedRows.slice(offset, offset + limit)
  const currentUser = currentUsername
    ? (() => {
        const found = rankedRows.find((row) => row.username === currentUsername) ?? {
          username: currentUsername,
          score: 0,
          rank: rankedRows.length + 1,
          isCurrentUser: true,
        }
        const previous = rankedRows[found.rank - 2]

        return {
          ...found,
          gapToPrevious: previous ? Math.max(previous.score - found.score, 0) : 0,
        }
      })()
    : null

  return res.json({
    items,
    currentUser,
    total: rankedRows.length,
    period,
  })
})

router.get('/events', (req, res) => {
  const db = getDatabase()
  const username = typeof req.query.username === 'string' ? req.query.username.trim() : ''
  const limit = normalizePositiveInteger(req.query.limit, 20, 100)

  if (!isValidUsernameValue(username)) {
    return res.status(400).json({ error: 'username is required' })
  }

  const items = db
    .prepare(
      `
        SELECT event_id AS eventId, username, score_delta AS scoreDelta, source, event_date AS eventDate, created_at AS createdAt
        FROM leaderboard_events
        WHERE username = ?
        ORDER BY event_date DESC, created_at DESC
        LIMIT ?
      `,
    )
    .all(username, limit)

  return res.json({ items })
})

router.post('/', (req, res) => {
  const username = isValidUsernameValue(req.body?.username) ? req.body.username.trim() : ''
  const score = req.body?.score
  const eventId = isValidEventId(req.body?.eventId)
    ? req.body.eventId.trim()
    : `legacy:${username}:${Date.now()}`
  const source = typeof req.body?.source === 'string' && req.body.source.trim()
    ? req.body.source.trim().slice(0, 80)
    : 'daily-challenge'
  const eventDate = getEventDate(req.body?.date)

  if (!username) {
    return res.status(400).json({ error: 'username is required' })
  }

  if (!isNonNegativeInteger(score)) {
    return res.status(400).json({ error: 'score must be a non-negative integer' })
  }

  const db = getDatabase()
  const insertEvent = db
    .prepare(
      `
        INSERT OR IGNORE INTO leaderboard_events (event_id, username, score_delta, source, event_date)
        VALUES (?, ?, ?, ?, ?)
      `,
    )
    .run(eventId, username, score, source, eventDate)

  if (insertEvent.changes > 0) {
    db.prepare(
      `
        INSERT INTO leaderboard (username, score)
        VALUES (?, ?)
        ON CONFLICT(username) DO UPDATE SET score = leaderboard.score + excluded.score
      `,
    ).run(username, score)
  }

  const total = db
    .prepare('SELECT username, score FROM leaderboard WHERE username = ?')
    .get(username) as LeaderboardRow | undefined

  return res.json({
    username,
    score: total?.score ?? 0,
    addedScore: insertEvent.changes > 0 ? score : 0,
    eventId,
    duplicated: insertEvent.changes === 0,
  })
})

export default router

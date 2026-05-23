import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = join(__dirname, '..', 'data')
const databasePath = join(dataDir, 'app.db')

let db: Database.Database | null = null

export function initDatabase() {
  mkdirSync(dataDir, { recursive: true })

  db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      password_hash TEXT,
      password_salt TEXT
    );

    CREATE TABLE IF NOT EXISTS user_accounts (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_submissions (
      user_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (user_id, platform)
    );

    CREATE TABLE IF NOT EXISTS user_state (
      user_id TEXT PRIMARY KEY,
      settings TEXT,
      training_plan TEXT,
      daily_challenge TEXT
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      username TEXT PRIMARY KEY,
      score INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leaderboard_events (
      event_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      score_delta INTEGER NOT NULL,
      source TEXT NOT NULL,
      event_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leaderboard_events_username
      ON leaderboard_events(username);

    CREATE INDEX IF NOT EXISTS idx_leaderboard_events_date
      ON leaderboard_events(event_date);
  `)

  for (const column of ['password_hash', 'password_salt']) {
    try {
      db.prepare(`ALTER TABLE users ADD COLUMN ${column} TEXT`).run()
    } catch {
      // Existing databases already have this column.
    }
  }

  return db
}

export type UserRow = { id: string }

export function getDatabase() {
  if (!db) {
    return initDatabase()
  }

  return db
}

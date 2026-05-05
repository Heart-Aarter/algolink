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
      created TEXT NOT NULL,
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

export function getDatabase() {
  if (!db) {
    return initDatabase()
  }

  return db
}

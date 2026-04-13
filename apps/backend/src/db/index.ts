import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH
  ?? path.join(process.cwd(), 'data', 'isovershell.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) throw new Error('Database not initialized — call initDb() first')
  return _db
}

export function initDb(): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  runMigrations(_db)
  console.log(`[db] ready → ${DB_PATH}`)
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      color      TEXT    NOT NULL DEFAULT '#6366f1',
      icon       TEXT    NOT NULL DEFAULT 'folder',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hosts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      label      TEXT    NOT NULL,
      hostname   TEXT    NOT NULL,
      port       INTEGER NOT NULL DEFAULT 22,
      username   TEXT    NOT NULL,
      auth_type  TEXT    NOT NULL CHECK(auth_type IN ('password', 'key')),
      group_id   INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      tags       TEXT    NOT NULL DEFAULT '[]',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id         INTEGER NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
      auth_type       TEXT    NOT NULL CHECK(auth_type IN ('password', 'key')),
      encrypted_value TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_history (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id          INTEGER NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
      connected_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      disconnected_at  TEXT,
      duration_seconds INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

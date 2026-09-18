import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const DB_PATH = process.env.DATABASE_PATH
  ?? path.join(process.cwd(), 'data', 'isovershell.db')

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!_db) throw new Error('Database not initialized — call initDb() first')
  return _db
}

export function initDb(): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  _db = new DatabaseSync(DB_PATH)
  _db.exec("PRAGMA journal_mode = WAL")
  _db.exec("PRAGMA foreign_keys = ON")

  runMigrations(_db)
  console.log(`[db] ready → ${DB_PATH}`)
}

function runMigrations(db: DatabaseSync): void {
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

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Add passphrase column to credentials if not present (idempotent)
  try { db.exec(`ALTER TABLE credentials ADD COLUMN passphrase TEXT`) } catch { /* already exists */ }

  // Seed default user if not present
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('lando-moritz')
  if (!existing) {
    const hash = bcrypt.hashSync('IsoverShell!', 12)
    db.prepare(`INSERT INTO users (username, password_hash) VALUES (?, ?)`).run('lando-moritz', hash)
    console.log('[db] default user created: lando-moritz')
  }
}

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");
export const DATA_DIR = path.join(BACKEND_ROOT, "data");
export const DB_PATH = path.join(DATA_DIR, "focusdeep.db");
export const BACKUP_DIR = path.join(BACKEND_ROOT, "backups");

export const DEFAULT_GROUP = "ungrouped";
export const DEFAULT_CATEGORY = "general";

let db = null;

export function getDb() {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}

export function initDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = FULL");

  runSchema(db);
  seedDefaults(db);

  return db;
}

function runSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      goalHours REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL REFERENCES groups(id) ON UPDATE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      goalHours REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
      startISO TEXT NOT NULL,
      endISO TEXT NOT NULL,
      durationMs INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_startISO ON sessions(startISO DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_categoryId ON sessions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_categories_groupId ON categories(groupId);

    CREATE TABLE IF NOT EXISTS running (
      id TEXT PRIMARY KEY CHECK (id = 'current'),
      categoryId TEXT NOT NULL,
      startISO TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      globalGoalHours REAL NOT NULL DEFAULT 0,
      version INTEGER,
      migratedAt TEXT
    );
  `);
}

function seedDefaults(database) {
  const groupCount = database.prepare("SELECT COUNT(*) AS count FROM groups").get().count;
  if (groupCount === 0) {
    database.prepare(
      "INSERT INTO groups (id, name, color, goalHours) VALUES (?, ?, ?, ?)"
    ).run(DEFAULT_GROUP, "Ungrouped", "#94a3b8", 0);
  }

  const catCount = database.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
  if (catCount === 0) {
    database.prepare(
      "INSERT INTO categories (id, groupId, name, color, goalHours) VALUES (?, ?, ?, ?, ?)"
    ).run(DEFAULT_CATEGORY, DEFAULT_GROUP, "General", "#4f46e5", 0);
  }

  const settings = database.prepare("SELECT id FROM settings WHERE id = 'global'").get();
  if (!settings) {
    database.prepare(
      "INSERT INTO settings (id, globalGoalHours) VALUES ('global', 0)"
    ).run();
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

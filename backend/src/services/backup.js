import fs from "fs";
import path from "path";
import { BACKUP_DIR, DB_PATH, getDb } from "../db/database.js";

const MAX_BACKUPS = 30;

export function createBackup(label = "auto") {
  if (!fs.existsSync(DB_PATH)) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `focusdeep-${timestamp}-${label}.db`;
  const dest = path.join(BACKUP_DIR, filename);

  // Checkpoint WAL into main db file before copying
  const db = getDb();
  db.pragma("wal_checkpoint(TRUNCATE)");

  fs.copyFileSync(DB_PATH, dest);
  pruneOldBackups();

  return dest;
}

function pruneOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("focusdeep-") && f.endsWith(".db"))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const file of files.slice(MAX_BACKUPS)) {
    fs.unlinkSync(file.path);
  }
}

export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("focusdeep-") && f.endsWith(".db"))
    .map((f) => {
      const full = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(full);
      return { name: f, path: full, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function restoreFromBackup(backupName) {
  const backupPath = path.join(BACKUP_DIR, backupName);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupName}`);
  }

  createBackup("pre-restore");
  fs.copyFileSync(backupPath, DB_PATH);
}

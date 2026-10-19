import { randomUUID } from "crypto";
import { getDb, DEFAULT_GROUP, DEFAULT_CATEGORY } from "../db/database.js";
import { createBackup } from "../services/backup.js";

export function uid() {
  return randomUUID();
}

export function nowISO() {
  return new Date().toISOString();
}

export function getBootstrap() {
  const db = getDb();

  const groups = db.prepare("SELECT id, name, color, goalHours FROM groups").all();
  const categories = db.prepare("SELECT id, groupId, name, color, goalHours FROM categories").all();
  const sessions = db
    .prepare("SELECT id, categoryId, startISO, endISO, durationMs, note FROM sessions ORDER BY startISO DESC")
    .all();
  const running = db.prepare("SELECT id, categoryId, startISO FROM running WHERE id = 'current'").get() || null;
  const settingsRow = db.prepare("SELECT globalGoalHours FROM settings WHERE id = 'global'").get();
  const settings = settingsRow ? { globalGoalHours: settingsRow.globalGoalHours } : { globalGoalHours: 0 };

  return { groups, categories, sessions, running, settings };
}

export function addGroup(name = "New group", color = "#60a5fa") {
  const db = getDb();
  const g = { id: uid(), name, color, goalHours: 0 };
  db.prepare("INSERT INTO groups (id, name, color, goalHours) VALUES (@id, @name, @color, @goalHours)").run(g);
  return g;
}

export function updateGroup(g) {
  const db = getDb();
  db.prepare("UPDATE groups SET name = @name, color = @color, goalHours = @goalHours WHERE id = @id").run(g);
  return g;
}

export function deleteGroup(groupId) {
  if (groupId === DEFAULT_GROUP) throw new Error("Cannot delete default group.");

  const db = getDb();
  const g = db.prepare("SELECT id, name, color, goalHours FROM groups WHERE id = ?").get(groupId);
  if (!g) return null;

  createBackup("pre-delete-group");

  const tx = db.transaction(() => {
    db.prepare("UPDATE categories SET groupId = ? WHERE groupId = ?").run(DEFAULT_GROUP, groupId);
    db.prepare("DELETE FROM groups WHERE id = ?").run(groupId);
  });
  tx();

  return g;
}

export function addCategory(name, color = "#10b981", groupId = DEFAULT_GROUP) {
  const db = getDb();
  const cat = { id: uid(), name, color, goalHours: 0, groupId };
  db.prepare(
    "INSERT INTO categories (id, groupId, name, color, goalHours) VALUES (@id, @groupId, @name, @color, @goalHours)"
  ).run(cat);
  return cat;
}

export function updateCategory(cat) {
  const db = getDb();
  db.prepare(
    "UPDATE categories SET groupId = @groupId, name = @name, color = @color, goalHours = @goalHours WHERE id = @id"
  ).run(cat);
  return cat;
}

export function deleteCategory(catId) {
  if (catId === DEFAULT_CATEGORY) throw new Error("Cannot delete the default category.");

  const db = getDb();
  const cat = db.prepare("SELECT id, groupId, name, color, goalHours FROM categories WHERE id = ?").get(catId);
  if (!cat) return null;

  createBackup("pre-delete-category");

  const tx = db.transaction(() => {
    db.prepare("UPDATE sessions SET categoryId = ? WHERE categoryId = ?").run(DEFAULT_CATEGORY, catId);
    db.prepare("DELETE FROM categories WHERE id = ?").run(catId);
  });
  tx();

  return cat;
}

export function addSession(session) {
  const db = getDb();
  db.prepare(
    "INSERT INTO sessions (id, categoryId, startISO, endISO, durationMs, note) VALUES (@id, @categoryId, @startISO, @endISO, @durationMs, @note)"
  ).run(session);
  return session;
}

export function addManualSession(catId, startISO, endISO, note = "") {
  const durationMs = new Date(endISO) - new Date(startISO);
  if (durationMs <= 0) return false;

  const session = { id: uid(), categoryId: catId, startISO, endISO, durationMs, note };
  addSession(session);
  return session;
}

export function saveEditedSession(session) {
  const db = getDb();
  db.prepare(
    "UPDATE sessions SET categoryId = @categoryId, startISO = @startISO, endISO = @endISO, durationMs = @durationMs, note = @note WHERE id = @id"
  ).run(session);
  return session;
}

export function deleteSession(id) {
  const db = getDb();
  const s = db.prepare("SELECT id, categoryId, startISO, endISO, durationMs, note FROM sessions WHERE id = ?").get(id);
  if (!s) return null;

  createBackup("pre-delete-session");
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  return s;
}

export function restoreSession(session) {
  return addSession(session);
}

export function restoreCategory(cat) {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO categories (id, groupId, name, color, goalHours) VALUES (@id, @groupId, @name, @color, @goalHours)"
  ).run(cat);
  return cat;
}

export function restoreGroup(g) {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO groups (id, name, color, goalHours) VALUES (@id, @name, @color, @goalHours)"
  ).run(g);
  return g;
}

export function startTimer(categoryId) {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM running WHERE id = 'current'").get();
  if (existing) return null;

  const run = { id: "current", categoryId, startISO: nowISO() };
  db.prepare("INSERT INTO running (id, categoryId, startISO) VALUES (@id, @categoryId, @startISO)").run(run);
  return run;
}

export function changeRunningCategory(newCatId) {
  const db = getDb();
  const running = db.prepare("SELECT id, categoryId, startISO FROM running WHERE id = 'current'").get();
  if (!running) return null;

  const updated = { ...running, categoryId: newCatId };
  db.prepare("UPDATE running SET categoryId = @categoryId WHERE id = 'current'").run(updated);
  return updated;
}

export function stopTimer(note = "") {
  const db = getDb();
  const r = db.prepare("SELECT id, categoryId, startISO FROM running WHERE id = 'current'").get();
  if (!r) return null;

  const endISO = nowISO();
  const durationMs = new Date(endISO) - new Date(r.startISO);
  const session = { id: uid(), categoryId: r.categoryId, startISO: r.startISO, endISO, durationMs, note };

  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO sessions (id, categoryId, startISO, endISO, durationMs, note) VALUES (@id, @categoryId, @startISO, @endISO, @durationMs, @note)"
    ).run(session);
    db.prepare("DELETE FROM running WHERE id = 'current'").run();
  });
  tx();

  return session;
}

export function updateSettings(settings) {
  const db = getDb();
  db.prepare("UPDATE settings SET globalGoalHours = @globalGoalHours WHERE id = 'global'").run({
    globalGoalHours: settings.globalGoalHours ?? 0,
  });
  return settings;
}

export function importAll(payload) {
  const db = getDb();
  createBackup("pre-import");

  const { groups = [], categories = [], sessions = [], running = null, settings = { globalGoalHours: 0 } } = payload;

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM sessions").run();
    db.prepare("DELETE FROM running").run();
    db.prepare("DELETE FROM categories").run();
    db.prepare("DELETE FROM groups").run();
    db.prepare("DELETE FROM settings").run();

    const insertGroup = db.prepare(
      "INSERT INTO groups (id, name, color, goalHours) VALUES (@id, @name, @color, @goalHours)"
    );
    const insertCategory = db.prepare(
      "INSERT INTO categories (id, groupId, name, color, goalHours) VALUES (@id, @groupId, @name, @color, @goalHours)"
    );
    const insertSession = db.prepare(
      "INSERT INTO sessions (id, categoryId, startISO, endISO, durationMs, note) VALUES (@id, @categoryId, @startISO, @endISO, @durationMs, @note)"
    );

    for (const g of groups) insertGroup.run(g);
    for (const c of categories) insertCategory.run(c);
    for (const s of sessions) insertSession.run(s);

    if (running) {
      db.prepare("INSERT INTO running (id, categoryId, startISO) VALUES ('current', ?, ?)").run(
        running.categoryId,
        running.startISO
      );
    }

    db.prepare("INSERT INTO settings (id, globalGoalHours, version, migratedAt) VALUES ('global', ?, 1, ?)").run(
      settings.globalGoalHours ?? 0,
      new Date().toISOString()
    );
  });

  tx();
  return getBootstrap();
}

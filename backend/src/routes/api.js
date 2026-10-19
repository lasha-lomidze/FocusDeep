import { Router } from "express";
import {
  getBootstrap,
  addGroup,
  updateGroup,
  deleteGroup,
  addCategory,
  updateCategory,
  deleteCategory,
  addManualSession,
  saveEditedSession,
  deleteSession,
  restoreSession,
  restoreCategory,
  restoreGroup,
  startTimer,
  changeRunningCategory,
  stopTimer,
  updateSettings,
  importAll,
} from "../services/data.js";
import { createBackup, listBackups } from "../services/backup.js";

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get("/bootstrap", (_req, res) => {
  res.json(getBootstrap());
});

router.post("/groups", asyncHandler((req, res) => {
  const { name, color } = req.body;
  res.status(201).json(addGroup(name, color));
}));

router.put("/groups/:id", asyncHandler((req, res) => {
  res.json(updateGroup(req.body));
}));

router.delete("/groups/:id", asyncHandler((req, res) => {
  const deleted = deleteGroup(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Group not found" });
  res.json(deleted);
}));

router.post("/groups/restore", asyncHandler((req, res) => {
  res.status(201).json(restoreGroup(req.body));
}));

router.post("/categories", asyncHandler((req, res) => {
  const { name, color, groupId } = req.body;
  res.status(201).json(addCategory(name, color, groupId));
}));

router.put("/categories/:id", asyncHandler((req, res) => {
  res.json(updateCategory(req.body));
}));

router.delete("/categories/:id", asyncHandler((req, res) => {
  const deleted = deleteCategory(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Category not found" });
  res.json(deleted);
}));

router.post("/categories/restore", asyncHandler((req, res) => {
  res.status(201).json(restoreCategory(req.body));
}));

router.post("/sessions", asyncHandler((req, res) => {
  const { categoryId, startISO, endISO, note } = req.body;
  const session = addManualSession(categoryId, startISO, endISO, note);
  if (!session) return res.status(400).json({ error: "Invalid session duration" });
  res.status(201).json(session);
}));

router.put("/sessions/:id", asyncHandler((req, res) => {
  res.json(saveEditedSession(req.body));
}));

router.delete("/sessions/:id", asyncHandler((req, res) => {
  const deleted = deleteSession(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Session not found" });
  res.json(deleted);
}));

router.post("/sessions/restore", asyncHandler((req, res) => {
  res.status(201).json(restoreSession(req.body));
}));

router.post("/running/start", asyncHandler((req, res) => {
  const { categoryId } = req.body;
  const run = startTimer(categoryId);
  if (!run) return res.status(409).json({ error: "Timer already running" });
  res.status(201).json(run);
}));

router.put("/running/category", asyncHandler((req, res) => {
  const { categoryId } = req.body;
  const updated = changeRunningCategory(categoryId);
  if (!updated) return res.status(404).json({ error: "No running timer" });
  res.json(updated);
}));

router.post("/running/stop", asyncHandler((req, res) => {
  const { note } = req.body || {};
  const session = stopTimer(note);
  if (!session) return res.status(404).json({ error: "No running timer" });
  res.json(session);
}));

router.put("/settings", asyncHandler((req, res) => {
  res.json(updateSettings(req.body));
}));

router.post("/import", asyncHandler((req, res) => {
  res.json(importAll(req.body));
}));

router.post("/backup", asyncHandler((_req, res) => {
  const path = createBackup("manual");
  res.status(201).json({ ok: true, path });
}));

router.get("/backups", asyncHandler((_req, res) => {
  res.json(listBackups());
}));

export default router;

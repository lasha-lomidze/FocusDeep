import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes/api.js";
import { initDatabase, closeDatabase } from "./db/database.js";
import { createBackup } from "./services/backup.js";

// Setup __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 42000;
const BACKUP_INTERVAL_MS = 48 * 60 * 60 * 1000;


initDatabase();
createBackup("startup");

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "10mb" }));

// 1. Declare API routes first
app.use("/api", apiRouter);

// 2. Resolve path to your compiled frontend build folder
// Adjust '../frontend/dist' if your build folder has a different name or path relative to this file
const frontendBuildPath = path.resolve(__dirname, "../../frontend/dist");

// 3. Serve static files from the build folder
app.use(express.static(frontendBuildPath));

// 4. Wildcard catch-all: serve index.html for React/SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.message?.includes("Cannot delete") ? 400 : 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`FocusDeep running locally on http://localhost:${PORT}`);
});

const backupTimer = setInterval(() => {
  try {
    createBackup("scheduled");
    console.log("Scheduled backup created");
  } catch (err) {
    console.error("Scheduled backup failed:", err);
  }
}, BACKUP_INTERVAL_MS);

function shutdown() {
  clearInterval(backupTimer);
  try {
    createBackup("shutdown");
  } catch (err) {
    console.error("Shutdown backup failed:", err);
  }
  closeDatabase();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
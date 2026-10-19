/**
 * One-time migration: export IndexedDB (Dexie) data to a JSON file for backend import.
 *
 * Usage:
 *   1. Start the OLD frontend (with Dexie) OR open the app in browser
 *   2. Open DevTools console and paste this script, OR run from project root:
 *      node backend/scripts/export-from-browser.mjs
 *
 * For browser export, paste in console while app is open:
 */
export const BROWSER_EXPORT_SNIPPET = `
(async () => {
  const req = indexedDB.open("TimersAppDB");
  req.onsuccess = async () => {
    const db = req.result;
    const read = (store) => new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly");
      const r = tx.objectStore(store).getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const [groups, categories, sessions, runningRows, settingsRows] = await Promise.all([
      read("groups"), read("categories"), read("sessions"), read("running"), read("settings")
    ]);
    const running = runningRows.find(r => r.id === "current") || null;
    const globalSettings = settingsRows.find(s => s.id === "global") || { globalGoalHours: 0 };
    const payload = {
      groups, categories,
      sessions: sessions.sort((a,b) => b.startISO.localeCompare(a.startISO)),
      running,
      settings: { globalGoalHours: globalSettings.globalGoalHours ?? 0 }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "focusdeep-export.json";
    a.click();
    console.log("Exported", payload.sessions.length, "sessions");
  };
})();
`;

console.log("=== FocusDeep Dexie → SQLite Migration ===\n");
console.log("Step 1: Open your app in the browser (with existing Dexie data)");
console.log("Step 2: Open DevTools console and paste:\n");
console.log(BROWSER_EXPORT_SNIPPET);
console.log("\nStep 3: Import the downloaded JSON into the backend:");
console.log("  cd backend && npm run import -- ../focusdeep-export.json\n");

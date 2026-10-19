import { initDatabase, closeDatabase } from "../src/db/database.js";
import { createBackup } from "../src/services/backup.js";

initDatabase();
const path = createBackup("manual-cli");
closeDatabase();

if (path) {
  console.log(`Backup created: ${path}`);
} else {
  console.log("No database file to backup yet.");
}

import fs from "fs";
import { initDatabase, closeDatabase } from "../src/db/database.js";
import { importAll } from "../src/services/data.js";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npm run import -- <path-to-export.json>");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(filePath, "utf8");
const payload = JSON.parse(raw);

initDatabase();
const result = importAll(payload);
closeDatabase();

console.log("Import complete:");
console.log(`  Groups: ${result.groups.length}`);
console.log(`  Categories: ${result.categories.length}`);
console.log(`  Sessions: ${result.sessions.length}`);
console.log(`  Running: ${result.running ? "yes" : "no"}`);

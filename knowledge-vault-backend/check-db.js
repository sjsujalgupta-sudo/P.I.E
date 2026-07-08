import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function check() {
  const db = await open({
    filename: "./vault.db",
    driver: sqlite3.Database
  });
  console.log("CWD:", process.cwd());
  const count = await db.get("SELECT COUNT(*) as count FROM browsing_data");
  console.log("Record count in browsing_data:", count.count);
  const rows = await db.all("SELECT id, url, title, timestamp FROM browsing_data ORDER BY timestamp DESC LIMIT 5");
  console.log("Sample rows:", JSON.stringify(rows, null, 2));
}

check().catch(console.error);

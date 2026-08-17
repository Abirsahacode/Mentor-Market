/**
 * Creates all tables from schema.sql using the project's mysql2 dependency.
 * Run:  node database/init-tables.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
  timezone: "Z",
});

try {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  console.log("Creating database and tables...");
  await connection.query(sql);
  
  // Verify
  await connection.changeUser({ database: "mentor_market" });
  const [tables] = await connection.query("SHOW TABLES");
  console.log(`\n✅ Done! ${tables.length} tables created:`);
  tables.forEach((row) => console.log(`   - ${Object.values(row)[0]}`));
  console.log("\nYou can now register and log in.");
} catch (err) {
  console.error(`\n❌ Failed: ${err.message}`);
  process.exit(1);
} finally {
  await connection.end();
}

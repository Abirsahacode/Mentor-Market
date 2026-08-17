/**
 * Database setup script — creates all tables and seeds demo data.
 * Uses the project's mysql2 dependency so no mysql CLI is needed.
 *
 * Usage:  node database/setup.mjs
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
  multipleStatements: true,          // required so we can run full .sql files
  timezone: "Z",
});

const run = async (label, file) => {
  const sql = readFileSync(join(__dirname, file), "utf-8");
  process.stdout.write(`⏳ ${label}…\n`);
  await connection.query(sql);
  process.stdout.write(`✅ ${label} — done\n`);
};

try {
  await run("Creating database and tables", "schema.sql");
  await run("Seeding demo data", "seed.sql");
  process.stdout.write("\n🎉 Database is ready. You can now register or log in.\n");
} catch (err) {
  process.stderr.write(`\n❌ Setup failed: ${err.message}\n`);
  process.exit(1);
} finally {
  await connection.end();
}

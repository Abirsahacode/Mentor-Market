/**
 * Quick database connection diagnostic.
 * Run:  node database/test-connection.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mentor_market",
};

console.log("Testing connection with:");
console.log(`  Host:     ${config.host}`);
console.log(`  Port:     ${config.port}`);
console.log(`  User:     ${config.user}`);
console.log(`  Password: ${config.password ? "(set)" : "(empty)"}`);
console.log(`  Database: ${config.database}`);
console.log();

try {
  const conn = await mysql.createConnection(config);
  await conn.ping();
  console.log("✅ Connection successful!");

  const [tables] = await conn.query("SHOW TABLES");
  console.log(`\n📋 Tables found (${tables.length}):`);
  tables.forEach((row) => console.log(`   - ${Object.values(row)[0]}`));

  const [users] = await conn.query("SELECT COUNT(*) AS count FROM users");
  console.log(`\n👤 Users in database: ${users[0].count}`);

  await conn.end();
} catch (err) {
  console.error(`\n❌ Connection failed: ${err.code || err.message}`);
  if (err.code === "ECONNREFUSED") {
    console.error("   → MySQL is not running or not listening on the configured host/port.");
    console.error("   → If using XAMPP/WAMP/Laragon, make sure MySQL is started.");
  } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("   → Wrong username or password. Check DB_USER and DB_PASSWORD in .env");
  } else if (err.code === "ER_BAD_DB_ERROR") {
    console.error("   → Database 'mentor_market' does not exist. Create it first.");
  } else if (err.code === "ER_NO_SUCH_TABLE") {
    console.error("   → Tables are missing. Run the schema.sql against your database.");
  }
  console.error(`\n   Full error: ${err.message}`);
  process.exit(1);
}

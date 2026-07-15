import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/db.js";

const port = Number(process.env.PORT || 5000);

try {
  await checkDatabaseConnection();
  app.listen(port, () => {
    process.stdout.write(`Mentor Market API listening on http://localhost:${port}\n`);
  });
} catch (error) {
  process.stderr.write(`Database connection failed: ${error.message}\n`);
  process.exit(1);
}


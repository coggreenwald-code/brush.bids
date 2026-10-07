// Local-only Postgres for testing on a Mac. Data lives in .local-db/ inside the
// project (git-ignored) and never touches the Replit database.
// Usage: npm run db:local   (leave it running in its own terminal)
import EmbeddedPostgres from "embedded-postgres";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), ".local-db");
const port = 5433;

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

async function main() {
  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase("brushbids");
  } catch {
    // Already exists.
  }
  console.log(`Local Postgres ready at postgres://postgres:postgres@localhost:${port}/brushbids (Ctrl+C to stop)`);
}

async function shutdown() {
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(async (err) => {
  console.error(err);
  await pg.stop().catch(() => {});
  process.exit(1);
});

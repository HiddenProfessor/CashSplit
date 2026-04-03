import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Load .env (Node doesn't do this automatically like Next.js)
const envPath = path.resolve(process.cwd(), ".env");
try {
  const envContent = await readFile(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^(\w+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
} catch {}

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/cashsplit.db";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || undefined;

function resolveUrl(raw) {
  const match = raw.match(/^file:(.+)$/);
  if (!match) return raw;
  const filePath = match[1];
  if (path.isAbsolute(filePath)) return raw;
  return `file:${path.resolve(process.cwd(), filePath)}`;
}

async function main() {
  const client = createClient({
    url: resolveUrl(DATABASE_URL),
    encryptionKey: ENCRYPTION_KEY,
  });

  // Create migration tracking table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY,
      migration_name TEXT NOT NULL UNIQUE,
      finished_at DATETIME,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Find migration directories
  const migrationsDir = path.resolve(process.cwd(), "prisma", "migrations");
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const migrationDirs = entries
    .filter((e) => e.isDirectory() && e.name !== "migration_lock.toml")
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of migrationDirs) {
    // Check if already applied
    const result = await client.execute({
      sql: "SELECT id FROM _prisma_migrations WHERE migration_name = ?",
      args: [dir.name],
    });

    if (result.rows.length > 0) {
      console.log(`  ✓ ${dir.name} (already applied)`);
      continue;
    }

    // Read and apply migration SQL
    const sqlPath = path.join(migrationsDir, dir.name, "migration.sql");
    const sql = await readFile(sqlPath, "utf-8");

    const statements = sql
      .split(";")
      .map((s) => s.replace(/--[^\n]*/g, "").trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    // Record migration
    const id = crypto.randomUUID();
    await client.execute({
      sql: "INSERT INTO _prisma_migrations (id, migration_name, finished_at, applied_steps_count) VALUES (?, ?, datetime('now'), 1)",
      args: [id, dir.name],
    });

    console.log(`  ✓ ${dir.name} (applied)`);
  }

  console.log("Migrations complete.");
  client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

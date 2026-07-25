/**
 * Apply SQL files directly via pg, bypassing Supabase CLI's prepared-statement limitation.
 * Usage: bun run scripts/apply-migration.ts [file.sql ...]
 * Default: supabase/migrations/0001_init.sql + supabase/seed.sql
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const Pool = pg.Pool;

async function main() {
  const password = readPasswordFromArgs();
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? "yuiwhixznkqevkvoharn";
  const conn = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

  const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const targets = files.length > 0
    ? files
    : ["supabase/migrations/0001_init.sql", "supabase/seed.sql"];

  const pool = new Pool({ connectionString: conn, max: 1 });
  try {
    for (const f of targets) {
      const path = resolve(process.cwd(), f);
      const sql = readFileSync(path, "utf8");
      console.log(`[migrate] applying ${f} (${sql.length} bytes)`);
      await pool.query(sql);
      console.log(`[migrate] ✓ ${f} applied`);
    }

    const verify = await pool.query("SELECT slug, name FROM sources ORDER BY name");
    console.log(`\n[migrate] sources in DB (${verify.rows.length}):`);
    for (const r of verify.rows) {
      console.log(`  - ${r.slug}: ${r.name}`);
    }
  } finally {
    await pool.end();
  }
}

function readPasswordFromArgs(): string {
  const env = process.env.SUPABASE_DB_PASSWORD;
  if (env && env.length > 0) return env;
  const fromFile = process.env.SUPABASE_DB_PASSWORD_FILE;
  if (fromFile) return readFileSync(fromFile, "utf8").trim();
  throw new Error("Provide DB password via SUPABASE_DB_PASSWORD env or SUPABASE_DB_PASSWORD_FILE env");
}

main().catch((e) => {
  console.error("[migrate] FATAL:", e);
  process.exit(1);
});

/**
 * Apply the SQL migration files via Supabase service role.
 * For a fresh project, this creates all tables.
 *
 * Usage:
 *   bun run scripts/apply-migration.ts [path/to/file.sql]
 *
 * Without args, applies 0001_init.sql then seed.sql.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getServerSupabase } from "../lib/supabase-server";

async function run(sql: string, label: string) {
  const sb = getServerSupabase();
  console.log(`[migrate] applying: ${label}`);
  const { error } = await sb.rpc("exec_sql", { sql_text: sql });
  if (error) {
    // Fallback: try REST POST to /pg/exec (Supabase doesn't expose arbitrary SQL via RPC).
    // Instead we'll print so the user can paste into SQL Editor.
    console.warn(`[migrate] cannot exec via RPC (${error.message}).`);
    console.warn("[migrate] Open Supabase Dashboard → SQL Editor → New query → paste the file → Run.");
    console.warn(`[migrate] file: ${label}`);
    return false;
  }
  console.log(`[migrate] ✓ ${label} applied`);
  return true;
}

async function main() {
  const files = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["supabase/migrations/0001_init.sql", "supabase/seed.sql"];

  let allOk = true;
  for (const f of files) {
    const path = resolve(process.cwd(), f);
    const sql = readFileSync(path, "utf8");
    const ok = await run(sql, f);
    if (!ok) allOk = false;
  }
  if (!allOk) {
    console.log("\n[migrate] Note: Supabase doesn't expose raw SQL via RPC. Apply manually.");
    process.exit(0); // not fatal
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * One-off cleanup for the `analyses` table.
 *
 *   1. Backfill `posting_id` by matching `analyses.url` against `propiedades.url`
 *      (handling the `https://www.zonaprop.com.ar` prefix).
 *   2. Deduplicate: per posting_id, keep only the most recent row. For rows
 *      that still have NULL posting_id (orphans), dedupe by URL keeping newest.
 *   3. Print before/after stats so you can sanity-check.
 *
 * Run from apps/web:
 *   node scripts/cleanup-analyses.mjs           // dry-run (default)
 *   node scripts/cleanup-analyses.mjs --apply   // actually mutate
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DIRECT_URL/DATABASE_URL in apps/web/.env');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

async function count(sql, params = []) {
  const { rows } = await client.query(sql, params);
  return Number(rows[0]?.count ?? 0);
}

try {
  console.log(`Mode: ${APPLY ? 'APPLY (will mutate)' : 'DRY-RUN (no changes)'}\n`);

  const total       = await count('SELECT COUNT(*) AS count FROM analyses');
  const withPosting = await count('SELECT COUNT(*) AS count FROM analyses WHERE posting_id IS NOT NULL');
  console.log(`analyses total:               ${total}`);
  console.log(`analyses with posting_id:     ${withPosting}`);
  console.log(`analyses without posting_id:  ${total - withPosting}\n`);

  await client.query('BEGIN');

  // ── Step 1: backfill posting_id from analyses.url ────────────────────────
  // analyses.url has many shapes: full URL with :443, full URL without, just
  // the path, sometimes with ?query. The reliable signal is the trailing
  // numeric id before `.html` (or at the end for argenprop), which is the
  // posting_id. Extract it and match against propiedades.posting_id directly.
  //
  // Regex captures the LAST run of digits before optional `.html` and optional
  // `?...` tail.
  const backfillSql = `
    UPDATE analyses a
    SET posting_id = sub.matched_posting_id
    FROM (
      SELECT
        a.id,
        (
          SELECT (regexp_matches(a.url, '(\\d+)\\.html(?:\\?|$)'))[1]
          UNION ALL
          SELECT (regexp_matches(a.url, '-(\\d+)$'))[1]
          LIMIT 1
        ) AS matched_posting_id
      FROM analyses a
      WHERE a.posting_id IS NULL
    ) sub
    WHERE a.id = sub.id
      AND sub.matched_posting_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM propiedades p WHERE p.posting_id = sub.matched_posting_id);
  `;
  const backfill = await client.query(backfillSql);
  console.log(`Backfilled posting_id on ${backfill.rowCount} row(s)`);

  // Show top duplicates (by posting_id) after backfill.
  const { rows: dupesByPosting } = await client.query(`
    SELECT posting_id, COUNT(*) AS n
    FROM analyses
    WHERE posting_id IS NOT NULL
    GROUP BY posting_id
    HAVING COUNT(*) > 1
    ORDER BY n DESC
    LIMIT 10;
  `);
  console.log(`Posting_ids with duplicates: ${dupesByPosting.length}${dupesByPosting.length === 10 ? '+ (top 10 shown)' : ''}`);
  for (const r of dupesByPosting) console.log(`  ${r.posting_id} → ${r.n} rows`);

  // ── Step 2: delete duplicates per posting_id, keep newest ────────────────
  const deleteByPostingSql = `
    DELETE FROM analyses a
    USING analyses b
    WHERE a.posting_id IS NOT NULL
      AND a.posting_id = b.posting_id
      AND a.created_at < b.created_at;
  `;
  const delByPosting = await client.query(deleteByPostingSql);
  console.log(`\nDeleted by posting_id (older copies): ${delByPosting.rowCount}`);

  // ── Step 3: delete orphans (rows whose extracted posting_id is not in
  //          propiedades, so they cannot be linked back to a publication).
  const deleteOrphansSql = `
    DELETE FROM analyses
    WHERE posting_id IS NULL;
  `;
  const delOrphans = await client.query(deleteOrphansSql);
  console.log(`Deleted orphan rows (no posting_id link): ${delOrphans.rowCount}`);

  if (APPLY) {
    await client.query('COMMIT');
    console.log('\n✓ Committed.');
  } else {
    await client.query('ROLLBACK');
    console.log('\n(rolled back — pass --apply to commit)');
  }

  const totalAfter   = await count('SELECT COUNT(*) AS count FROM analyses');
  const withPostingA = await count('SELECT COUNT(*) AS count FROM analyses WHERE posting_id IS NOT NULL');
  console.log(`\nFINAL  total=${totalAfter}  with_posting_id=${withPostingA}  orphans=${totalAfter - withPostingA}`);
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('✗ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

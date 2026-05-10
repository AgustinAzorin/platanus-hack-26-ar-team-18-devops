/**
 * Delete `feed_results` rows whose posting_id has no matching `analyses` row.
 * These are leftovers from the old chat-by-neighborhood flow: the feed cards
 * exist but their reports were never persisted under the right posting_id, so
 * /informe/[id] would 404 anyway.
 *
 * Run from apps/web:
 *   node scripts/cleanup-feed-results.mjs           // dry-run
 *   node scripts/cleanup-feed-results.mjs --apply   // actually mutate
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

try {
  console.log(`Mode: ${APPLY ? 'APPLY (will mutate)' : 'DRY-RUN'}\n`);

  const before = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM feed_results)                                                  AS feed_total,
      (SELECT COUNT(*) FROM feed_results WHERE EXISTS
        (SELECT 1 FROM analyses a WHERE a.posting_id = feed_results.posting_id))           AS feed_with_analysis,
      (SELECT COUNT(*) FROM analyses)                                                      AS analyses_total
  `);
  const stats = before.rows[0];
  console.log(`feed_results total:             ${stats.feed_total}`);
  console.log(`feed_results WITH analysis:     ${stats.feed_with_analysis}`);
  console.log(`feed_results to delete:         ${stats.feed_total - stats.feed_with_analysis}`);
  console.log(`analyses total (reference):     ${stats.analyses_total}\n`);

  await client.query('BEGIN');

  const del = await client.query(`
    DELETE FROM feed_results
    WHERE NOT EXISTS (
      SELECT 1 FROM analyses a WHERE a.posting_id = feed_results.posting_id
    );
  `);
  console.log(`Deleted ${del.rowCount} feed_results rows`);

  if (APPLY) {
    await client.query('COMMIT');
    console.log('\n✓ Committed.');
  } else {
    await client.query('ROLLBACK');
    console.log('\n(rolled back — pass --apply to commit)');
  }

  const after = await client.query('SELECT COUNT(*) AS c FROM feed_results');
  console.log(`\nFINAL feed_results count: ${after.rows[0].c}`);
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('✗ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const sqlPath = resolve(__dirname, 'sql', '001_chats_messages.sql');
const sql = readFileSync(sqlPath, 'utf8');

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DIRECT_URL/DATABASE_URL in apps/web/.env');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  console.log(`> Running ${sqlPath}`);
  await client.query(sql);
  console.log('✓ SQL applied');
} catch (err) {
  // Tolerate "already member of publication" and similar idempotency errors.
  const msg = String(err?.message ?? err);
  if (/already a member|already exists/i.test(msg)) {
    console.warn('⚠  ', msg);
  } else {
    console.error('✗ Failed:', msg);
    process.exitCode = 1;
  }
} finally {
  await client.end();
}

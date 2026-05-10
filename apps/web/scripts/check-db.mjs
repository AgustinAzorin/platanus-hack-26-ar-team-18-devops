import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const users = await client.query(`
    select id, email, name, phone_e164, created_at
    from public.users
    order by created_at desc
    limit 10;
  `);
  console.log(`users (${users.rowCount}):`);
  for (const r of users.rows) console.log(' ', r);
} finally {
  await client.end();
}

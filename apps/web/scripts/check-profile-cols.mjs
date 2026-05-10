import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
await client.connect();
const cols = await client.query(`
  select column_name, data_type
  from information_schema.columns
  where table_schema='public' and table_name='users'
    and column_name in ('has_pet','pet_details','has_real_estate','real_estate_location','has_guarantor','guarantor_details','caucion_status')
  order by column_name;
`);
console.log('profile cols:', cols.rows);
const row = await client.query(`select id, name, has_pet, has_real_estate, has_guarantor, caucion_status from public.users where id = '11111111-1111-4111-8111-111111111111'::uuid`);
console.log('Ezequiel:', row.rows[0] ?? '(missing)');
await client.end();

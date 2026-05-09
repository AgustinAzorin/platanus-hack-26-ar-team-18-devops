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
  const cols = await client.query(`
    select column_name, data_type
    from information_schema.columns
    where table_schema='public' and table_name='propiedades'
    order by ordinal_position;
  `);
  console.log('propiedades columns:');
  for (const r of cols.rows) console.log(` - ${r.column_name} (${r.data_type})`);

  const phoneish = cols.rows.filter((r) => /phone|whats|digit|tel|seller|contact|owner/i.test(r.column_name));
  console.log('\nphone-ish candidates:', phoneish.map((r) => r.column_name));

  if (phoneish.length > 0) {
    const sample = await client.query(
      `select posting_id, ${phoneish.map((c) => `"${c.column_name}"`).join(', ')} from public.propiedades limit 3;`,
    );
    console.log('\nsample rows:');
    for (const row of sample.rows) console.log(' ', row);
  }
} finally {
  await client.end();
}

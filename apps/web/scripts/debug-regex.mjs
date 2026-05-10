import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(`
  SELECT id, url,
    (regexp_match(url, '(\\d+)\\.html(?:\\?|$)'))[1] AS html_id,
    (regexp_match(url, '-(\\d+)$'))[1] AS tail_id
  FROM analyses
  ORDER BY created_at DESC
`);

for (const r of rows) {
  console.log(`${r.id.slice(0, 8)} | html_id=${r.html_id} | tail_id=${r.tail_id} | url=${r.url}`);
}

console.log('\nChecking which extracted ids exist in propiedades:');
for (const r of rows) {
  const candidate = r.html_id ?? r.tail_id;
  if (!candidate) {
    console.log(`  ${r.id.slice(0, 8)} | NO id extracted`);
    continue;
  }
  const { rows: m } = await client.query(
    'SELECT posting_id FROM propiedades WHERE posting_id = $1',
    [candidate],
  );
  console.log(`  ${r.id.slice(0, 8)} | candidate=${candidate} → ${m.length > 0 ? 'MATCH' : 'no match'}`);
}

await client.end();

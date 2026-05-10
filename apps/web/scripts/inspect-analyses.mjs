import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();

const a = await client.query('SELECT id, url, posting_id, created_at FROM analyses ORDER BY created_at DESC');
console.log('analyses rows:');
for (const r of a.rows) {
  console.log(`  ${r.id.slice(0, 8)} | posting_id=${r.posting_id ?? 'NULL'} | url=${r.url}`);
}

console.log('\nSample propiedades.url (first 5):');
const p = await client.query('SELECT posting_id, url FROM propiedades WHERE url IS NOT NULL LIMIT 5');
for (const r of p.rows) {
  console.log(`  posting_id=${r.posting_id} | url=${r.url}`);
}

// For each analysis, try to find a matching propiedad
console.log('\nMatching attempts:');
for (const r of a.rows) {
  const path = r.url.replace(/^https?:\/\/www\.zonaprop\.com\.ar/, '');
  const { rows: matches } = await client.query(
    `SELECT posting_id, url FROM propiedades
     WHERE url = $1 OR url = $2 LIMIT 1`,
    [r.url, path],
  );
  if (matches.length > 0) {
    console.log(`  ${r.id.slice(0, 8)} → posting_id=${matches[0].posting_id} (matched)`);
  } else {
    // Try fuzzy: search for any propiedad whose url contains the slug
    const slug = path.split('/').pop()?.replace(/\.html$/, '');
    if (slug) {
      const { rows: fuzzy } = await client.query(
        `SELECT posting_id, url FROM propiedades WHERE url ILIKE $1 LIMIT 3`,
        [`%${slug}%`],
      );
      if (fuzzy.length > 0) {
        console.log(`  ${r.id.slice(0, 8)} → fuzzy matches by slug "${slug}":`);
        for (const m of fuzzy) console.log(`      posting_id=${m.posting_id} url=${m.url}`);
      } else {
        console.log(`  ${r.id.slice(0, 8)} → NO MATCH (analyses url=${r.url})`);
      }
    }
  }
}

await client.end();

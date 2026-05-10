import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
await client.connect();
try {
  console.log('=== Total propiedades ===');
  const total = await client.query(`select count(*)::int as n from public.propiedades`);
  console.log(' ', total.rows[0]);

  console.log('\n=== Distinct neighborhoods (top 20 por count) ===');
  const neighs = await client.query(`
    select neighborhood, count(*)::int as n
    from public.propiedades
    where neighborhood ilike '%palermo%'
    group by neighborhood
    order by n desc;
  `);
  for (const r of neighs.rows) console.log(' ', r);

  console.log('\n=== Distinct price_type ===');
  const types = await client.query(`
    select price_type, count(*)::int as n from public.propiedades group by price_type;
  `);
  for (const r of types.rows) console.log(' ', r);

  console.log('\n=== Distinct rooms (en Palermo) ===');
  const rooms = await client.query(`
    select rooms, count(*)::int as n
    from public.propiedades
    where neighborhood ilike '%palermo%'
    group by rooms order by rooms;
  `);
  for (const r of rooms.rows) console.log(' ', r);

  console.log('\n=== Match exacto del executor: neighborhood=Palermo, ARS<=800k, rooms=1 ===');
  const match = await client.query(`
    select count(*)::int as n
    from public.propiedades
    where neighborhood = 'Palermo'
      and price_type = 'ARS'
      and price_value <= 800000
      and rooms = 1;
  `);
  console.log(' ', match.rows[0]);

  console.log('\n=== Relajado: neighborhood ILIKE %palermo%, ARS, rooms<=1 ===');
  const relaxed = await client.query(`
    select count(*)::int as n
    from public.propiedades
    where neighborhood ilike '%palermo%'
      and price_type = 'ARS'
      and price_value <= 800000
      and (rooms <= 1 or rooms is null);
  `);
  console.log(' ', relaxed.rows[0]);

  console.log('\n=== Sin filtro de price_type, en Palermo, rooms=1 ===');
  const noPriceType = await client.query(`
    select price_type, count(*)::int as n
    from public.propiedades
    where neighborhood = 'Palermo' and rooms = 1
    group by price_type;
  `);
  for (const r of noPriceType.rows) console.log(' ', r);

  console.log('\n=== analyses count ===');
  const a = await client.query(`select count(*)::int as n from public.analyses`);
  console.log(' ', a.rows[0]);

  const aPalermo = await client.query(`
    select count(*)::int as n
    from public.analyses a
    where exists (
      select 1 from public.propiedades p
      where p.url = a.url and p.neighborhood ilike '%palermo%'
    );
  `);
  console.log('  analyses con propiedades en Palermo:', aPalermo.rows[0]);
} finally {
  await client.end();
}

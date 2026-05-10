import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
await client.connect();
try {
  console.log('=== Filter cascade for "Palermo, 1 amb, $ ARS hasta 800k" ===');

  const total = await client.query(`select count(*)::int as n from public.propiedades`);
  console.log(`  total propiedades: ${total.rows[0].n}`);

  const palermo = await client.query(`
    select count(*)::int as n from public.propiedades
    where neighborhood ilike '%palermo%';
  `);
  console.log(`  + neighborhood ilike '%palermo%': ${palermo.rows[0].n}`);

  const palermoArs = await client.query(`
    select count(*)::int as n from public.propiedades
    where neighborhood ilike '%palermo%' and price_type = '$';
  `);
  console.log(`  + price_type = '$' (ARS): ${palermoArs.rows[0].n}`);

  const palermoArs800 = await client.query(`
    select count(*)::int as n from public.propiedades
    where neighborhood ilike '%palermo%' and price_type = '$' and price_value <= 800000;
  `);
  console.log(`  + price_value <= 800000: ${palermoArs800.rows[0].n}`);

  const palermoArs800Mono = await client.query(`
    select count(*)::int as n from public.propiedades
    where neighborhood ilike '%palermo%' and price_type = '$' and price_value <= 800000 and rooms = 1;
  `);
  console.log(`  + rooms = 1: ${palermoArs800Mono.rows[0].n}`);

  const final = await client.query(`
    select count(*)::int as n from public.propiedades
    where neighborhood ilike '%palermo%' and price_type = '$' and price_value <= 800000
      and rooms = 1 and seller_whatsapp_digits is not null;
  `);
  console.log(`  + seller_whatsapp_digits not null: ${final.rows[0].n}  ← top of pipeline`);

  console.log('\n=== Sin filtro ambientes (capaz rooms está mal) ===');
  const noRooms = await client.query(`
    select count(*)::int as n, count(distinct rooms) as variantes
    from public.propiedades
    where neighborhood ilike '%palermo%' and price_type = '$' and price_value <= 800000
      and seller_whatsapp_digits is not null;
  `);
  console.log('  ', noRooms.rows[0]);

  console.log('\n=== Distribución de rooms (Palermo $ ARS <=800k contactables) ===');
  const dist = await client.query(`
    select rooms, count(*)::int as n
    from public.propiedades
    where neighborhood ilike '%palermo%' and price_type = '$' and price_value <= 800000
      and seller_whatsapp_digits is not null
    group by rooms order by rooms;
  `);
  for (const r of dist.rows) console.log(' ', r);

  console.log('\n=== Cuántas con seller_whatsapp_digits totales ===');
  const haveWa = await client.query(`
    select count(*)::int as n from public.propiedades
    where seller_whatsapp_digits is not null;
  `);
  console.log(' ', haveWa.rows[0]);
} finally {
  await client.end();
}

/**
 * Adds the `description_summary` column to `propiedades`.
 * Idempotent: uses IF NOT EXISTS.
 *
 * Run from apps/web:
 *   pnpm tsx -r dotenv/config scripts/add-summary-column.ts
 */

import { Client } from 'pg';

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DIRECT_URL/DATABASE_URL in .env');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('Connected. Running ALTER TABLE...');

  await client.query(`
    ALTER TABLE propiedades
      ADD COLUMN IF NOT EXISTS description_summary TEXT;
  `);

  const { rows } = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'propiedades' AND column_name = 'description_summary';
  `);
  console.log('Result:', rows);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

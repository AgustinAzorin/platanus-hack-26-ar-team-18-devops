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
  const chats = await client.query(`
    select id, phone_e164, contact_name, last_message_at, last_inbound_at, unread_count
    from public.chats
    order by created_at desc
    limit 10;
  `);
  console.log(`chats (${chats.rowCount}):`);
  for (const r of chats.rows) console.log(' ', r);

  const msgs = await client.query(`
    select id, chat_id, direction, kind, status, created_at, left(body, 80) as body_preview
    from public.messages
    order by created_at desc
    limit 10;
  `);
  console.log(`\nmessages (${msgs.rowCount}):`);
  for (const r of msgs.rows) console.log(' ', r);
} finally {
  await client.end();
}

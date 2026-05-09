/**
 * Batch summarization of `propiedades.description` -> `propiedades.description_summary`
 * using Anthropic Claude Haiku 4.5.
 *
 * Run from apps/web:
 *   pnpm summarize
 *
 * Required env vars (loaded from apps/web/.env via dotenv/config):
 *   - DIRECT_URL (or DATABASE_URL)
 *   - ANTHROPIC_API_KEY
 *
 * Idempotent: only processes rows where description_summary IS NULL.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Client } from 'pg';

const PG_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!PG_URL || !ANTHROPIC_API_KEY) {
  console.error('Missing env vars. Need DIRECT_URL/DATABASE_URL and ANTHROPIC_API_KEY.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const pg = new Client({ connectionString: PG_URL });

const CONCURRENCY = 6;
const PAGE_SIZE = 200;
const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = [
  'Sos un asistente que resume descripciones de propiedades inmobiliarias en CABA.',
  'Devolvé un resumen breve en español rioplatense neutro, en 2 oraciones cortas (máx ~50 palabras).',
  'Destacá: tipo de propiedad, m², ambientes/dormitorios, ubicación y 1-2 features clave (amenities, cochera, terraza, etc.).',
  'No inventes datos. No uses emojis, listas ni markdown. Tono directo y profesional.',
].join(' ');

interface Row {
  posting_id: string;
  description: string | null;
}

async function summarize(description: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 220,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Descripción:\n${description}` }],
  });
  const block = res.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text block in response');
  return block.text.trim();
}

async function processOne(row: Row): Promise<{ ok: boolean; id: string; err?: string }> {
  if (!row.description || row.description.length < 30) {
    await pg.query(
      'UPDATE propiedades SET description_summary = $1 WHERE posting_id = $2',
      ['', row.posting_id],
    );
    return { ok: true, id: row.posting_id };
  }
  try {
    const summary = await summarize(row.description);
    await pg.query(
      'UPDATE propiedades SET description_summary = $1 WHERE posting_id = $2',
      [summary, row.posting_id],
    );
    return { ok: true, id: row.posting_id };
  } catch (e) {
    return { ok: false, id: row.posting_id, err: e instanceof Error ? e.message : String(e) };
  }
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
  onProgress: (done: number, total: number, last: R) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let done = 0;
  const total = items.length;

  async function next(): Promise<void> {
    while (cursor < total) {
      const idx = cursor++;
      const out = await worker(items[idx]!);
      results[idx] = out;
      done++;
      onProgress(done, total, out);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
  return results;
}

async function fetchPending(limit: number): Promise<Row[]> {
  const { rows } = await pg.query<Row>(
    'SELECT posting_id, description FROM propiedades WHERE description_summary IS NULL LIMIT $1',
    [limit],
  );
  return rows;
}

async function main() {
  await pg.connect();
  const startedAt = Date.now();
  let processed = 0;
  let failed = 0;

  const { rows: pendingRows } = await pg.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM propiedades WHERE description_summary IS NULL',
  );
  const totalPending = Number(pendingRows[0]?.count ?? '0');
  console.log(`Pending: ${totalPending} rows without description_summary.`);

  for (;;) {
    const batch = await fetchPending(PAGE_SIZE);
    if (batch.length === 0) break;

    console.log(`\nBatch of ${batch.length} (concurrency=${CONCURRENCY})...`);

    await runPool(batch, CONCURRENCY, processOne, (d, t, last) => {
      const status = last.ok ? 'OK ' : 'ERR';
      const detail = last.err ? ` — ${last.err.slice(0, 80)}` : '';
      process.stdout.write(`  [${d}/${t}] ${status} ${last.id}${detail}\n`);
      if (last.ok) processed++;
      else failed++;
    });
  }

  await pg.end();
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nDone. processed=${processed} failed=${failed} in ${seconds}s`);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await pg.end();
  } catch {
    // ignore
  }
  process.exit(1);
});

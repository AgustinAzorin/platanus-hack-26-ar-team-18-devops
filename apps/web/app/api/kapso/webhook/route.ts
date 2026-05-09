import { NextResponse } from 'next/server';

import { kapsoEnv } from '../../../../lib/kapso/env';
import {
  extractLatestStatusError,
  verifyKapsoSignature,
  type KapsoMessageEnvelope,
} from '../../../../lib/kapso/webhook';
import { createServiceClient } from '../../../../lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOG = '[kapso:webhook]';

export async function POST(req: Request) {
  const env = kapsoEnv();
  const rawBody = await req.text();
  const event = req.headers.get('x-webhook-event');
  const sig = req.headers.get('x-webhook-signature');
  const idempotencyKey = req.headers.get('x-idempotency-key');
  const payloadVersion = req.headers.get('x-webhook-payload-version');

  console.log(LOG, 'received', { event, payloadVersion, idempotencyKey, hasSig: Boolean(sig), bodyBytes: rawBody.length });

  if (!event) {
    console.warn(LOG, 'missing X-Webhook-Event header');
    return new NextResponse('Missing X-Webhook-Event', { status: 400 });
  }

  // Skip verification when no secret is configured (local bootstrap before
  // registering the webhook). Once the secret is set, verification is enforced.
  if (env.KAPSO_WEBHOOK_SECRET) {
    if (!verifyKapsoSignature(rawBody, sig, env.KAPSO_WEBHOOK_SECRET)) {
      console.warn(LOG, 'invalid signature', { event });
      return new NextResponse('Invalid signature', { status: 401 });
    }
  } else {
    console.warn(LOG, 'KAPSO_WEBHOOK_SECRET is empty — accepting unsigned payloads (DEV ONLY)');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  // Always 200 quickly: ack first, mutate after.
  try {
    await handleEvent(event, payload);
  } catch (err) {
    console.error(LOG, 'handler error:', err, '\nevent:', event);
  }
  return new NextResponse('ok', { status: 200 });
}

// GET is useful for a quick manual ping in the browser.
export function GET() {
  return NextResponse.json({ ok: true, hint: 'POST here from Kapso' });
}

async function handleEvent(event: string, payload: unknown) {
  const supabase = createServiceClient();

  if (event === 'whatsapp.message.received') {
    const env = asMessageEnvelope(payload);
    if (!env) return;
    const phoneE164 = env.conversation.phone_number;
    const text = env.message.text?.body ?? env.message.kapso?.content ?? `[${env.message.type} message]`;
    const contactName = env.conversation.kapso?.contact_name ?? null;

    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .eq('phone_e164', phoneE164)
      .maybeSingle();

    let chatId = existing?.id;
    if (!chatId) {
      const { data: created, error } = await supabase
        .from('chats')
        .insert({ phone_e164: phoneE164, contact_name: contactName })
        .select('id')
        .single();
      if (error || !created) {
        throw new Error(`Failed to create chat for inbound: ${error?.message}`);
      }
      chatId = created.id;
      console.log(LOG, 'created chat', { chatId, phoneE164 });
    } else if (contactName) {
      await supabase.from('chats').update({ contact_name: contactName }).eq('id', chatId);
    }

    const { error: msgErr } = await supabase.from('messages').insert({
      chat_id: chatId,
      direction: 'in',
      body: text,
      kind: env.message.type,
      kapso_message_id: env.message.id,
      status: env.message.kapso?.status ?? 'received',
    });
    if (msgErr) console.error(LOG, 'failed to insert inbound message', msgErr);
    else console.log(LOG, 'persisted inbound', { chatId, wamid: env.message.id });
    return;
  }

  if (
    event === 'whatsapp.message.sent' ||
    event === 'whatsapp.message.delivered' ||
    event === 'whatsapp.message.read' ||
    event === 'whatsapp.message.failed'
  ) {
    const env = asMessageEnvelope(payload);
    if (!env) return;
    const wamid = env.message.id;
    const status = env.message.kapso?.status ?? event.split('.').pop() ?? null;
    const errorMsg = extractLatestStatusError(env);

    const { data: updated, error } = await supabase
      .from('messages')
      .update({ status, ...(errorMsg ? { error: errorMsg } : {}) })
      .eq('kapso_message_id', wamid)
      .select('id');
    if (error) console.error(LOG, 'status update failed', { wamid, status, error: error.message });
    else console.log(LOG, 'status update', { wamid, status, rowsUpdated: updated?.length ?? 0 });
    return;
  }

  if (event === 'whatsapp.conversation.created' || event === 'whatsapp.conversation.ended' || event === 'whatsapp.conversation.inactive') {
    // No-op for the demo. Could be used to lifecycle the chat row.
    console.log(LOG, 'conversation lifecycle (ignored)', { event });
    return;
  }

  console.log(LOG, 'unhandled event:', event);
}

function asMessageEnvelope(payload: unknown): KapsoMessageEnvelope | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (!p.message || !p.conversation) {
    console.warn(LOG, 'payload missing message/conversation, ignoring');
    return null;
  }
  return p as unknown as KapsoMessageEnvelope;
}

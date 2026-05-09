import 'server-only';
import { sendOpenerTemplate, sendText, type SentMessage } from './client';
import { kapsoEnv } from './env';
import { createServiceClient } from '../supabase/service';

const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface ChatRow {
  id: string;
  phone_e164: string;
  last_inbound_at: string | null;
}

/**
 * Decide whether the next outbound message must be a template (cold conversation
 * or 24h window expired) or can be free text. Then send and persist a `messages` row.
 */
export async function sendOutbound(chat: ChatRow, body: string) {
  const supabase = createServiceClient();
  const isWindowOpen =
    chat.last_inbound_at !== null && Date.now() - new Date(chat.last_inbound_at).getTime() < WINDOW_MS;

  // Insert pending row first so we can match the eventual webhook status update.
  const { data: pending, error: insertErr } = await supabase
    .from('messages')
    .insert({
      chat_id: chat.id,
      direction: 'out',
      body: isWindowOpen ? body : `[template:${kapsoEnv().KAPSO_TEMPLATE_NAME}] ${body}`,
      kind: isWindowOpen ? 'text' : 'template',
      status: 'queued',
    })
    .select('id')
    .single();

  if (insertErr || !pending) throw new Error(`Failed to persist message: ${insertErr?.message}`);

  let sent: SentMessage;
  try {
    sent = isWindowOpen
      ? await sendText(chat.phone_e164, body)
      : await sendOpenerTemplate(chat.phone_e164);
  } catch (err) {
    await supabase
      .from('messages')
      .update({ status: 'failed', error: err instanceof Error ? err.message : String(err) })
      .eq('id', pending.id);
    throw err;
  }

  await supabase
    .from('messages')
    .update({ kapso_message_id: sent.kapsoMessageId, status: 'sent' })
    .eq('id', pending.id);

  return { messageId: pending.id, kapsoMessageId: sent.kapsoMessageId, sentAsTemplate: !isWindowOpen };
}

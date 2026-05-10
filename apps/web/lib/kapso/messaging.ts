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

  const { data: pending, error: insertErr } = await supabase
    .from('messages')
    .insert({
      chat_id: chat.id,
      direction: 'out',
      body,
      kind: 'text',
      status: 'queued',
    })
    .select('id')
    .single();

  if (insertErr || !pending) throw new Error(`Failed to persist message: ${insertErr?.message}`);

  let sent: SentMessage;
  let sentAsTemplate = false;
  try {
    // Always try free text first. If the 24h window is closed Meta will reject
    // with a messaging-window error, and we fall back to the opener template.
    sent = await sendText(chat.phone_e164, body);
  } catch (textErr) {
    try {
      sent = await sendOpenerTemplate(chat.phone_e164);
      sentAsTemplate = true;
    } catch (tmplErr) {
      const err = tmplErr instanceof Error ? tmplErr : new Error(String(tmplErr));
      await supabase
        .from('messages')
        .update({ status: 'failed', error: err.message })
        .eq('id', pending.id);
      throw err;
    }
  }

  await supabase
    .from('messages')
    .update({ kapso_message_id: sent.kapsoMessageId, status: 'sent' })
    .eq('id', pending.id);

  return { messageId: pending.id, kapsoMessageId: sent.kapsoMessageId, sentAsTemplate };
}

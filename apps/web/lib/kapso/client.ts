import 'server-only';
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

import { kapsoEnv } from './env';

let cached: WhatsAppClient | null = null;

function getClient(): WhatsAppClient {
  if (cached) return cached;
  const env = kapsoEnv();
  cached = new WhatsAppClient({
    baseUrl: `${env.KAPSO_API_BASE_URL}/meta/whatsapp`,
    kapsoApiKey: env.KAPSO_API_KEY,
    graphVersion: env.META_GRAPH_VERSION,
  });
  return cached;
}

export interface SentMessage {
  kapsoMessageId: string;
  waId: string;
}

export async function sendText(to: string, body: string): Promise<SentMessage> {
  const env = kapsoEnv();
  const res = await getClient().messages.sendText({
    phoneNumberId: env.KAPSO_PHONE_NUMBER_ID,
    to,
    body,
  });
  return {
    kapsoMessageId: res.messages?.[0]?.id ?? '',
    waId: res.contacts?.[0]?.waId ?? to.replace(/^\+/, ''),
  };
}

/**
 * Sends the configured opener template (`mensaje_prueba`). The current template
 * has no variables; if you create one with `{{1}}`, `{{2}}`, etc., add a
 * `bodyParams` arg here and pass it through `template.components`.
 */
export async function sendOpenerTemplate(to: string): Promise<SentMessage> {
  const env = kapsoEnv();
  const res = await getClient().messages.sendTemplate({
    phoneNumberId: env.KAPSO_PHONE_NUMBER_ID,
    to,
    template: {
      name: env.KAPSO_TEMPLATE_NAME,
      language: { code: env.KAPSO_TEMPLATE_LANGUAGE },
    },
  });
  return {
    kapsoMessageId: res.messages?.[0]?.id ?? '',
    waId: res.contacts?.[0]?.waId ?? to.replace(/^\+/, ''),
  };
}

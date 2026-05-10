import 'server-only';

import { kapsoEnv } from './env';

export interface SentMessage {
  kapsoMessageId: string;
  waId: string;
}

interface MetaMessagesResponse {
  messaging_product?: string;
  contacts?: { input: string; wa_id: string }[];
  messages?: { id: string }[];
  error?: { message: string; code: number };
}

async function kapsoPost(path: string, body: unknown): Promise<MetaMessagesResponse> {
  const env = kapsoEnv();
  const url = `${env.KAPSO_API_BASE_URL}/meta/whatsapp/${env.META_GRAPH_VERSION}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.KAPSO_API_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as MetaMessagesResponse;
  if (json.error) {
    throw new Error(json.error.message);
  }
  return json;
}

export async function sendText(to: string, body: string): Promise<SentMessage> {
  const env = kapsoEnv();
  const res = await kapsoPost(`/${env.KAPSO_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body },
  });
  return {
    kapsoMessageId: res.messages?.[0]?.id ?? '',
    waId: res.contacts?.[0]?.wa_id ?? to.replace(/^\+/, ''),
  };
}

export async function sendOpenerTemplate(to: string): Promise<SentMessage> {
  const env = kapsoEnv();
  const res = await kapsoPost(`/${env.KAPSO_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: env.KAPSO_TEMPLATE_NAME,
      language: { code: env.KAPSO_TEMPLATE_LANGUAGE },
    },
  });
  return {
    kapsoMessageId: res.messages?.[0]?.id ?? '',
    waId: res.contacts?.[0]?.wa_id ?? to.replace(/^\+/, ''),
  };
}

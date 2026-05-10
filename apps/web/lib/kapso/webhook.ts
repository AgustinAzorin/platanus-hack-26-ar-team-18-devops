import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Kapso webhook (kind=kapso) signature.
 * Header `X-Webhook-Signature` is the HMAC-SHA256 hex digest of the raw body
 * using the webhook's signing secret. Some integrations prefix with "sha256=".
 */
export function verifyKapsoSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const provided = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ─── Kapso v2 payload shapes (events arrive via X-Webhook-Event header) ───
//
// All `whatsapp.message.*` events share the same envelope: a `message` object
// (with `id`, `type`, `text` and a nested `kapso` block carrying direction +
// status + the full status history), a `conversation` object (with the
// remote `phone_number`), and `phone_number_id` at the root.

export interface KapsoMessageEnvelope {
  message: {
    id: string;          // wamid.*
    timestamp?: string;
    type: string;        // text | image | audio | video | document | location | template | interactive | reaction | contacts
    text?: { body?: string };
    kapso?: {
      direction: 'inbound' | 'outbound';
      status: string;    // received | sent | delivered | read | failed
      processing_status?: string;
      origin?: string;
      has_media?: boolean;
      content?: string;
      transcript?: { text?: string };
      media_url?: string;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp?: string;
        recipient_id?: string;
        errors?: Array<{ code?: number; title?: string; message?: string }>;
      }>;
    };
    [key: string]: unknown;
  };
  conversation: {
    id?: string;
    phone_number: string;          // remote contact, e.g. "+5491155557777"
    phone_number_id?: string;
    status?: string;
    kapso?: {
      contact_name?: string | null;
      messages_count?: number;
      last_message_text?: string | null;
      last_inbound_at?: string | null;
      last_outbound_at?: string | null;
    };
    [key: string]: unknown;
  };
  is_new_conversation?: boolean;
  phone_number_id: string;
}

/** Latest status of an outbound message + any error message attached to it. */
export function extractLatestStatusError(env: KapsoMessageEnvelope): string | null {
  const statuses = env.message.kapso?.statuses ?? [];
  if (statuses.length === 0) return null;
  const last = statuses[statuses.length - 1]!;
  if (!last.errors || last.errors.length === 0) return null;
  return last.errors.map((e) => e.message ?? e.title ?? `code ${e.code}`).join('; ');
}

import { NextResponse } from 'next/server';

import { kapsoEnv } from '../../../lib/kapso/env';
import { sendOutbound } from '../../../lib/kapso/messaging';
import { arAltPhone, toE164 } from '../../../lib/kapso/phone';
import { createServiceClient } from '../../../lib/supabase/service';
import { createClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


interface CreateChatBody {
  posting_id?: string;
  phone?: string;
  contact_name?: string;
  initial_message?: string;
}

export async function POST(req: Request) {
  let body: CreateChatBody;
  try {
    body = (await req.json()) as CreateChatBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const env = kapsoEnv();
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  // Resolve destination phone: explicit `phone`, or pulled from `propiedades.seller_whatsapp_digits`.
  const supabase = createServiceClient();
  let phoneRaw = body.phone ?? null;
  const postingId = body.posting_id ?? null;

  if (!phoneRaw && postingId) {
    const { data: prop, error: propErr } = await supabase
      .from('propiedades' as never)
      .select('seller_whatsapp_digits' as never)
      .eq('posting_id' as never, postingId as never)
      .maybeSingle();
    if (propErr) {
      return NextResponse.json({ error: `Propiedad lookup failed: ${propErr.message}` }, { status: 500 });
    }
    const sellerPhone = (prop as { seller_whatsapp_digits?: string | null } | null)?.seller_whatsapp_digits ?? null;
    if (!sellerPhone) {
      return NextResponse.json({ error: 'Propiedad sin seller_whatsapp_digits' }, { status: 404 });
    }
    phoneRaw = sellerPhone;
  }
  if (!phoneRaw) {
    return NextResponse.json({ error: 'Missing phone or posting_id' }, { status: 400 });
  }

  let phoneE164: string;
  try {
    phoneE164 = toE164(phoneRaw, env.KAPSO_DEFAULT_COUNTRY_ISO);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid phone' }, { status: 400 });
  }

  // Upsert chat by phone (one chat per destination).
  // Argentine mobile numbers have two valid formats: +541112345678 (without the '9')
  // and +5491112345678 (with the '9'). Inbound webhooks use one; outbound may use the other.
  // Try both so we always reuse the same chat row.
  const altE164 = arAltPhone(phoneE164);
  const phonesToTry = altE164 ? [phoneE164, altE164] : [phoneE164];

  const { data: existing } = await supabase
    .from('chats')
    .select('id, phone_e164, last_inbound_at')
    .in('phone_e164', phonesToTry)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  let chat = existing;
  if (!chat) {
    const { data: created, error } = await supabase
      .from('chats')
      .insert({
        phone_e164: phoneE164,
        propiedad_posting_id: postingId,
        contact_name: body.contact_name ?? null,
        user_id: user?.id ?? null,
      })
      .select('id, phone_e164, last_inbound_at')
      .single();
    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create chat' }, { status: 500 });
    }
    chat = created;
  }

  if (body.initial_message) {
    try {
      const result = await sendOutbound(chat, body.initial_message);
      return NextResponse.json({ chat, sent: result }, { status: 201 });
    } catch (err) {
      // Chat and message are saved in DB even when WhatsApp delivery fails.
      // Return 201 so the UI can navigate to the chat thread.
      return NextResponse.json(
        { chat, sent: null, send_warning: err instanceof Error ? err.message : 'Send failed' },
        { status: 201 },
      );
    }
  }

  return NextResponse.json({ chat }, { status: 201 });
}

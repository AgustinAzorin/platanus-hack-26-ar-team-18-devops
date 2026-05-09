import { createClient } from '../../lib/supabase/server';

export interface FeaturedProperty {
  title: string;
  address: string;
  price: string;
  imgUrl: string | null;
  specs: string[];
}

interface PropiedadRow {
  posting_id: string;
  url: string | null;
  image_urls: string[] | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  price_value: number | null;
  price_type: string | null;
  square_meters_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
}

const SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, square_meters_area, rooms, bedrooms, bathrooms, parking';

export async function fetchFeaturedProperty(): Promise<FeaturedProperty | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propiedades')
    .select(SELECT)
    .not('image_urls', 'is', null)
    .not('price_value', 'is', null)
    .order('scraped_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  const p = data[0] as PropiedadRow;

  const ambs = p.rooms ?? 1;
  const word = ambs === 1 ? 'Monoamb.' : `${ambs} amb.`;
  const where = p.neighborhood ?? p.city ?? 'CABA';

  const m2 = p.square_meters_area ? `${Math.round(p.square_meters_area)}m²` : null;
  const dorms = p.bedrooms ? `${p.bedrooms} dorm` : null;
  const baths = p.bathrooms ? `${p.bathrooms} baño${p.bathrooms > 1 ? 's' : ''}` : null;
  const cochera = p.parking && p.parking > 0 ? 'cochera' : null;

  return {
    title: `Depto. ${word} ${where}`,
    address: `${(p.address ?? '').toUpperCase()} · ${(p.neighborhood ?? p.city ?? '').toUpperCase()}`,
    price: formatPrice(p),
    imgUrl: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0]! : null,
    specs: [m2, dorms, baths, cochera].filter(Boolean) as string[],
  };
}

function formatPrice(p: PropiedadRow): string {
  if (!p.price_value) return '—';
  const symbol = p.price_type === 'USD' ? 'USD' : '$';
  return `${symbol} ${new Intl.NumberFormat('es-AR').format(Math.round(p.price_value))}`;
}

// ───────────────────────── chats ─────────────────────────

export interface ChatSummary {
  id: string;
  phone_e164: string;
  contact_name: string | null;
  propiedad_posting_id: string | null;
  propiedad_label: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  direction: 'in' | 'out';
  body: string | null;
  kind: string;
  status: string | null;
  created_at: string;
}

interface ChatRow {
  id: string;
  phone_e164: string;
  contact_name: string | null;
  propiedad_posting_id: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  unread_count: number | null;
}

export async function fetchChats(): Promise<ChatSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chats')
    .select('id, phone_e164, contact_name, propiedad_posting_id, last_message_at, last_inbound_at, unread_count')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  const chats = data as ChatRow[];
  if (chats.length === 0) return [];

  const previewByChat = await fetchLatestPreviews(chats.map((c) => c.id));
  const labelByPosting = await fetchPropiedadLabels(chats.map((c) => c.propiedad_posting_id).filter(Boolean) as string[]);

  return chats.map((c) => ({
    id: c.id,
    phone_e164: c.phone_e164,
    contact_name: c.contact_name,
    propiedad_posting_id: c.propiedad_posting_id,
    propiedad_label: c.propiedad_posting_id ? labelByPosting.get(c.propiedad_posting_id) ?? null : null,
    last_message_at: c.last_message_at,
    last_inbound_at: c.last_inbound_at,
    last_message_preview: previewByChat.get(c.id) ?? null,
    unread_count: c.unread_count ?? 0,
  }));
}

export async function fetchMessages(chatId: string, limit = 200): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, direction, body, kind, status, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as ChatMessage[];
}

async function fetchLatestPreviews(chatIds: string[]): Promise<Map<string, string>> {
  if (chatIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select('chat_id, body, created_at')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false });
  const out = new Map<string, string>();
  for (const row of (data ?? []) as { chat_id: string; body: string | null }[]) {
    if (!out.has(row.chat_id) && row.body) out.set(row.chat_id, row.body);
  }
  return out;
}

async function fetchPropiedadLabels(postingIds: string[]): Promise<Map<string, string>> {
  if (postingIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from('propiedades')
    .select('posting_id, neighborhood, address')
    .in('posting_id', postingIds);
  const out = new Map<string, string>();
  for (const row of (data ?? []) as { posting_id: string; neighborhood: string | null; address: string | null }[]) {
    out.set(row.posting_id, row.neighborhood ?? row.address ?? row.posting_id);
  }
  return out;
}

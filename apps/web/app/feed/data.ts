import { getCurrentClientUserId } from '../../lib/search/profile';
import { createClient } from '../../lib/supabase/server';
import { createServiceClient } from '../../lib/supabase/service';

export type CardStatus = 'contacted' | 'responded' | 'discarded' | 'pending';

export interface FeedCard {
  id: string;
  imgUrl: string | null;
  src: string;
  score: number;
  scoreClass?: 'bad' | 'warn';
  title: string;
  addr: string;
  price: string;
  exp: string;
  specs: string[];
  heart?: boolean;
  status: CardStatus;
  statusKind: 'responded-fed' | 'casita-wrote' | 'pending' | 'casita-called' | 'mariana' | 'discarded' | 'casita-no-response' | 'ai-report';
  statusMin: number; // for "hace X min"
  sourceUrl: string;
  summary: string | null;
  pros?: string[];
  cons?: string[];
  discarded?: boolean;
  approveAction: 'detail-chat' | 'approve-detail' | 'force-detail' | 'feed-decide';
  feedRowId?: string;     // present when this card came from feed_results — needed by accept/reject
  matchScore?: number;    // 0..100 from feed_results
}

export interface FeedSummary {
  total: number;
  scanned: number;
  filtered: number;
  contacted: number;
  responded: number;
  pending: number;
  discarded: number;
  fromAI: boolean;
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
  expenses_value: number | null;
  square_meters_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  description: string | null;
  description_summary?: string | null;
}

interface FeedResultRow {
  id: string;
  posting_id: string;
  match_score: number | null;
  report_summary: string | null;
  report_highlights: { pros?: string[]; cons?: string[] } | null;
  created_at: string;
}

const SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, parking, description, description_summary';

const STATUS_CYCLE: Array<FeedCard['statusKind']> = [
  'responded-fed',
  'casita-wrote',
  'pending',
  'casita-called',
  'mariana',
  'discarded',
  'casita-wrote',
  'pending',
  'casita-no-response',
];

export async function fetchFeed(limit = 12): Promise<{ cards: FeedCard[]; summary: FeedSummary }> {
  const aiCards = await fetchAiFeed(limit);
  if (aiCards.length > 0) {
    const summary: FeedSummary = {
      total: aiCards.length,
      scanned: aiCards.length,
      filtered: aiCards.length,
      contacted: 0,
      responded: 0,
      pending: aiCards.length,
      discarded: 0,
      fromAI: true,
    };
    return { cards: aiCards, summary };
  }
  return fetchMockFeed(limit);
}

async function fetchAiFeed(limit: number): Promise<FeedCard[]> {
  const userId = await getCurrentClientUserId();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('feed_results')
    .select('id, posting_id, match_score, report_summary, report_highlights, created_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('match_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    if (error) console.warn('[feed] feed_results query failed (table may not exist yet):', error.message);
    return [];
  }
  const rows = data as FeedResultRow[];

  // Join with propiedades for the rendering details.
  const propsByPosting = await fetchPropiedadesMap(rows.map((r) => r.posting_id));

  const out: FeedCard[] = [];
  for (const r of rows) {
    const p = propsByPosting.get(r.posting_id);
    if (!p) continue;
    const score = r.match_score ?? computeScore(p);
    const summary = r.report_summary?.trim() || p.description_summary?.trim() || null;
    const highlights = r.report_highlights ?? {};
    const card: FeedCard = {
      id: r.id,
      imgUrl: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0]! : null,
      src: 'casita ia',
      score,
      scoreClass: score < 50 ? 'bad' : score < 70 ? 'warn' : undefined,
      title: buildTitle(p),
      addr: `${p.address ?? '—'} · ${p.neighborhood ?? p.city ?? 'CABA'}`,
      price: formatPrice(p),
      exp: formatExpenses(p),
      specs: buildSpecs(p),
      heart: false,
      status: 'pending',
      statusKind: 'ai-report',
      statusMin: minutesAgo(r.created_at),
      sourceUrl: p.url
        ? p.url.startsWith('http') ? p.url : `https://www.zonaprop.com.ar${p.url}`
        : 'https://www.zonaprop.com.ar',
      summary,
      pros: Array.isArray(highlights.pros) ? highlights.pros : [],
      cons: Array.isArray(highlights.cons) ? highlights.cons : [],
      approveAction: 'feed-decide',
      feedRowId: r.id,
      matchScore: score,
    };
    out.push(card);
  }
  return out;
}

async function fetchPropiedadesMap(postingIds: string[]): Promise<Map<string, PropiedadRow>> {
  if (postingIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propiedades')
    .select(SELECT)
    .in('posting_id', postingIds);
  if (error || !data) return new Map();
  const out = new Map<string, PropiedadRow>();
  for (const row of data as PropiedadRow[]) out.set(row.posting_id, row);
  return out;
}

async function fetchMockFeed(limit: number): Promise<{ cards: FeedCard[]; summary: FeedSummary }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propiedades')
    .select(SELECT)
    .order('scraped_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[feed] fetchFeed failed', error);
    return { cards: [], summary: emptySummary() };
  }

  const rows = data as PropiedadRow[];
  const cards = rows.map((p, i) => mapMockRow(p, i));
  const summary: FeedSummary = {
    total: cards.length,
    scanned: 412,
    filtered: cards.length,
    contacted: cards.filter((c) => c.status === 'contacted' || c.status === 'responded').length,
    responded: cards.filter((c) => c.status === 'responded').length,
    pending: cards.filter((c) => c.status === 'pending').length,
    discarded: cards.filter((c) => c.status === 'discarded').length,
    fromAI: false,
  };
  return { cards, summary };
}

function mapMockRow(p: PropiedadRow, i: number): FeedCard {
  const score = computeScore(p);
  const statusKind = STATUS_CYCLE[i % STATUS_CYCLE.length] ?? 'casita-wrote';
  const status = mapKindToStatus(statusKind);
  const discarded = status === 'discarded';

  const summary = p.description_summary?.trim() || null;

  return {
    id: p.posting_id,
    imgUrl: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0]! : null,
    src: 'argenprop',
    score,
    scoreClass: score < 50 ? 'bad' : score < 70 ? 'warn' : undefined,
    title: buildTitle(p),
    addr: `${p.address ?? '—'} · ${p.neighborhood ?? p.city ?? 'CABA'}`,
    price: formatPrice(p),
    exp: formatExpenses(p),
    specs: buildSpecs(p),
    heart: i === 0,
    status,
    statusKind,
    statusMin: 14 + ((i * 7) % 180),
    sourceUrl: p.url ? `https://www.argenprop.com${p.url}` : 'https://www.argenprop.com',
    summary,
    discarded,
    approveAction: status === 'pending' ? 'approve-detail' : status === 'discarded' ? 'force-detail' : 'detail-chat',
  };
}

function buildSpecs(p: PropiedadRow): string[] {
  const desc = (p.description ?? '').toLowerCase();
  const features: string[] = [];
  if (p.parking && p.parking > 0) features.push('cochera');
  else if (desc.includes('terraza')) features.push('terraza');
  else if (desc.includes('balcón') || desc.includes('balcon')) features.push('balcón');
  else if (desc.includes('patio')) features.push('patio');
  else if (desc.includes('luminos')) features.push('luminoso');

  const m2 = p.square_meters_area ? `${Math.round(p.square_meters_area)} m²` : null;
  const ambStr = p.rooms ? `${p.rooms} amb` : null;
  const piso = p.bedrooms ? `${p.bedrooms}° piso` : null;
  return [m2, ambStr, piso, features[0]].filter(Boolean) as string[];
}

function mapKindToStatus(kind: FeedCard['statusKind']): CardStatus {
  if (kind === 'responded-fed' || kind === 'mariana') return 'responded';
  if (kind === 'pending' || kind === 'ai-report') return 'pending';
  if (kind === 'discarded') return 'discarded';
  return 'contacted';
}

function buildTitle(p: PropiedadRow): string {
  const rooms = p.rooms ?? 1;
  const ambWord = rooms === 1 ? 'Monoamb.' : `${rooms} amb.`;
  const desc = (p.description ?? '').toLowerCase();
  let qualifier = '';
  if (desc.includes('luminos')) qualifier = ' luminoso';
  else if (desc.includes('reciclad')) qualifier = ' reciclado';
  else if (desc.includes('estrenar')) qualifier = ' a estrenar';
  else if (desc.includes('balcón') || desc.includes('balcon')) qualifier = ' con balcón';
  else if (desc.includes('terraza')) qualifier = ' con terraza';
  return `${ambWord}${qualifier} en ${p.neighborhood ?? 'CABA'}`;
}

function formatPrice(p: PropiedadRow): string {
  if (!p.price_value) return 'Consultar';
  const symbol = p.price_type === 'USD' ? 'USD ' : '$ ';
  const v = p.price_value;
  if (v >= 1000) return `${symbol}${formatK(v)}`;
  return `${symbol}${new Intl.NumberFormat('es-AR').format(Math.round(v))}`;
}

function formatExpenses(p: PropiedadRow): string {
  if (!p.expenses_value) return '';
  return `+ $ ${formatK(p.expenses_value)} expensas`;
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return new Intl.NumberFormat('es-AR').format(Math.round(n));
}

function computeScore(p: PropiedadRow): number {
  if (!p.square_meters_area || !p.price_value) return 72;
  const pricePerM2 = p.price_value / p.square_meters_area;
  const base = Math.round(100 - pricePerM2 / 80);
  return Math.max(31, Math.min(98, base));
}

function minutesAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

function emptySummary(): FeedSummary {
  return { total: 0, scanned: 0, filtered: 0, contacted: 0, responded: 0, pending: 0, discarded: 0, fromAI: false };
}

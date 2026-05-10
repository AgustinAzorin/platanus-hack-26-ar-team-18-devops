import { createClient } from '../../lib/supabase/server';

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
  statusKind: 'responded-fed' | 'casita-wrote' | 'pending' | 'casita-called' | 'mariana' | 'discarded' | 'casita-no-response';
  statusMin: number; // for "hace X min"
  sourceUrl: string;
  summary: string | null;
  discarded?: boolean;
  approveAction: 'detail-chat' | 'approve-detail' | 'force-detail';
}

export interface FeedSummary {
  total: number;
  scanned: number;
  filtered: number;
  contacted: number;
  responded: number;
  pending: number;
  discarded: number;
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
  const cards = rows.map((p, i) => mapRow(p, i));
  const summary: FeedSummary = {
    total: cards.length,
    scanned: 412,
    filtered: cards.length,
    contacted: cards.filter((c) => c.status === 'contacted' || c.status === 'responded').length,
    responded: cards.filter((c) => c.status === 'responded').length,
    pending: cards.filter((c) => c.status === 'pending').length,
    discarded: cards.filter((c) => c.status === 'discarded').length,
  };
  return { cards, summary };
}

function mapRow(p: PropiedadRow, i: number): FeedCard {
  const score = computeScore(p);
  const statusKind = STATUS_CYCLE[i % STATUS_CYCLE.length] ?? 'casita-wrote';
  const status = mapKindToStatus(statusKind);
  const discarded = status === 'discarded';

  const summary = p.description_summary?.trim() || null;
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
  const specs = [m2, ambStr, piso, features[0]].filter(Boolean) as string[];

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
    specs,
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

function mapKindToStatus(kind: FeedCard['statusKind']): CardStatus {
  if (kind === 'responded-fed' || kind === 'mariana') return 'responded';
  if (kind === 'pending') return 'pending';
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

function emptySummary(): FeedSummary {
  return { total: 0, scanned: 0, filtered: 0, contacted: 0, responded: 0, pending: 0, discarded: 0 };
}

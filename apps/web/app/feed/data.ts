import type { AnalysisReport } from '@repo/types';

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
  feedRowId?: string;     // analyses.id — drives /informe/[id] navigation
  matchScore?: number;    // 0..100 (analyses.score scaled)
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

interface AnalysisRow {
  id: string;
  posting_id: string;
  score: number | null;
  report: AnalysisReport;
  created_at: string;
}

const SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, parking, description, description_summary';

export async function fetchFeed(limit = 12): Promise<{ cards: FeedCard[]; summary: FeedSummary }> {
  const cards = await fetchAnalysisFeed(limit);
  const summary: FeedSummary = {
    total: cards.length,
    scanned: cards.length,
    filtered: cards.length,
    contacted: 0,
    responded: 0,
    pending: cards.length,
    discarded: 0,
    fromAI: true,
  };
  return { cards, summary };
}

async function fetchAnalysisFeed(limit: number): Promise<FeedCard[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('id, posting_id, score, report, created_at')
    .not('posting_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as AnalysisRow[];
  if (error || rows.length === 0) {
    if (error) console.warn('[feed] analyses query failed:', error.message);
    return [];
  }

  const propsByPosting = await fetchPropiedadesMap(rows.map((r) => r.posting_id));

  const out: FeedCard[] = [];
  for (const r of rows) {
    const p = propsByPosting.get(r.posting_id);
    if (!p) continue;
    // analyses.score is on a 0–10 scale; scale it to 0–100 for the card UI.
    const score10 = r.score ?? r.report.score ?? 7;
    const score = Math.round(score10 * 10);
    const summary = r.report.resumen_ejecutivo?.trim() || r.report.veredicto?.trim() || null;
    const cons = Array.isArray(r.report.inmueble?.red_flags) ? r.report.inmueble.red_flags : [];

    out.push({
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
        ? p.url.startsWith('http')
          ? p.url
          : `https://www.zonaprop.com.ar${p.url}`
        : 'https://www.zonaprop.com.ar',
      summary,
      pros: [],
      cons,
      approveAction: 'feed-decide',
      feedRowId: r.id,
      matchScore: score,
    });
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

function minutesAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

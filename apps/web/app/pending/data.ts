import { createClient } from '../../lib/supabase/server';

export interface CardData {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  source: string;
  sourceUrl: string;
  score: number;
  scoreWarm?: boolean;
  type: string;
  description: string;
  summary: string | null;
  imgUrl: string | null;
  details: string;
  visitDate: string;
  urgent?: boolean;
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
  description: string | null;
  description_summary?: string | null;
}

interface AnalysisRow {
  posting_id: string | null;
  url: string | null;
  scraped_data: Record<string, unknown> | null;
  report: Record<string, unknown> | null;
  score: number | null;
  created_at: string | null;
}

const TYPES = ['VISITA A CONFIRMAR', 'MENSAJE POR APROBAR', 'PROPIEDAD ENCONTRADA', 'SOBRE PRESUPUESTO'];
const MOCK_VISIT_DATES = [
  'Mar 12/05 · 18:00',
  'Mié 13/05 · 17:30',
  'Jue 14/05 · 19:00',
  'Vie 15/05 · 16:30',
  'Sáb 16/05 · 11:00',
] as const;

const FULL_SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, description, description_summary';
const FALLBACK_SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, description';

export async function fetchPendingCards(limit = 5): Promise<CardData[]> {
  const supabase = await createClient();
  const { data: analysisRows, error: analysisError } = await supabase
    .from('analyses')
    .select('posting_id, url, scraped_data, report, score, created_at')
    .not('posting_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!analysisError && analysisRows && analysisRows.length > 0) {
    const analyses = analysisRows as AnalysisRow[];
    const postingIds = analyses.map((a) => a.posting_id).filter(Boolean) as string[];
    const propsByPostingId = await fetchPropertiesByPostingId(postingIds);
    return analyses.slice(0, 5).map((a, i) => {
      const prop = a.posting_id ? propsByPostingId.get(a.posting_id) ?? null : null;
      const fallback = propertyFromAnalysis(a);
      const p = prop ?? fallback;
      const summary = typeof a.report?.resumen_ejecutivo === 'string'
        ? a.report.resumen_ejecutivo.trim()
        : null;
      const score = typeof a.report?.score === 'number'
        ? a.report.score * 10
        : (a.score ? a.score * 10 : computeScore(p));

      return {
        id: a.posting_id ?? `analysis-${i}`,
        title: buildTitle(p),
        address: p.address ?? '—',
        neighborhood: p.neighborhood ?? p.city ?? '',
        source: sourceLabel(a.url ?? p.url),
        sourceUrl: buildSourceUrl(a.url ?? p.url),
        score: Math.max(0, Math.min(98, Math.round(score))),
        scoreWarm: score < 80,
        type: TYPES[i % TYPES.length] ?? 'PROPIEDAD ENCONTRADA',
        description: cleanDescription(p.description ?? ''),
        summary: summary || p.description_summary || null,
        imgUrl: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0]! : null,
        details: buildDetails(p),
        visitDate: MOCK_VISIT_DATES[i % MOCK_VISIT_DATES.length]!,
        urgent: i === 0,
      };
    });
  }

  if (analysisError) console.warn('[pending] analyses mocks unavailable:', analysisError.message);

  let { data, error } = await supabase
    .from('propiedades')
    .select(FULL_SELECT)
    .order('scraped_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn(
      '[pending] Falling back to query without description_summary. ' +
      'Run `ALTER TABLE propiedades ADD COLUMN description_summary TEXT;` to enable AI summaries. ' +
      `Error: ${error.message}`,
    );
    const fallback = await supabase
      .from('propiedades')
      .select(FALLBACK_SELECT)
      .order('scraped_at', { ascending: false })
      .limit(limit);
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error || !data) {
    console.error('[pending] fetchPendingCards failed', error);
    return [];
  }

  return (data as PropiedadRow[]).map((p, i) => {
    const score = computeScore(p);
    return {
      id: p.posting_id,
      title: buildTitle(p),
      address: p.address ?? '—',
      neighborhood: p.neighborhood ?? p.city ?? '',
      source: 'Argenprop',
      sourceUrl: p.url ? `https://www.argenprop.com${p.url}` : 'https://www.argenprop.com',
      score,
      scoreWarm: score < 80,
      type: TYPES[i % TYPES.length] ?? 'PROPIEDAD ENCONTRADA',
      description: cleanDescription(p.description ?? ''),
      summary: p.description_summary && p.description_summary.trim() ? p.description_summary.trim() : null,
      imgUrl: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0]! : null,
      details: buildDetails(p),
      visitDate: MOCK_VISIT_DATES[i % MOCK_VISIT_DATES.length]!,
      urgent: i === 0,
    };
  });
}

async function fetchPropertiesByPostingId(postingIds: string[]): Promise<Map<string, PropiedadRow>> {
  if (postingIds.length === 0) return new Map();
  const supabase = await createClient();
  let { data, error } = await supabase
    .from('propiedades')
    .select(FULL_SELECT)
    .in('posting_id', postingIds);

  if (error) {
    const fallback = await supabase
      .from('propiedades')
      .select(FALLBACK_SELECT)
      .in('posting_id', postingIds);
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  const out = new Map<string, PropiedadRow>();
  if (error || !data) return out;
  for (const p of data as PropiedadRow[]) out.set(p.posting_id, p);
  return out;
}

function propertyFromAnalysis(a: AnalysisRow): PropiedadRow {
  const s = a.scraped_data ?? {};
  const getString = (key: string) => (typeof s[key] === 'string' ? s[key] as string : null);
  const getNumber = (key: string) => (typeof s[key] === 'number' ? s[key] as number : null);
  const imageUrls = s.image_urls;
  return {
    posting_id: a.posting_id ?? `analysis-${a.created_at ?? ''}`,
    url: a.url ?? getString('url'),
    image_urls: Array.isArray(imageUrls) ? imageUrls.filter((u): u is string => typeof u === 'string') : null,
    address: getString('address'),
    neighborhood: getString('neighborhood'),
    city: getString('city'),
    price_value: getNumber('price_value'),
    price_type: getString('price_type'),
    expenses_value: getNumber('expenses_value'),
    square_meters_area: getNumber('square_meters_area'),
    rooms: getNumber('rooms'),
    bedrooms: getNumber('bedrooms'),
    bathrooms: getNumber('bathrooms'),
    description: getString('description'),
    description_summary: null,
  };
}

function buildTitle(p: PropiedadRow): string {
  const rooms = p.rooms ?? 1;
  const word = rooms === 1 ? 'Monoamb.' : `${rooms} amb.`;
  const where = p.neighborhood ?? p.city ?? 'CABA';
  return `${word} en ${where}`;
}

function buildDetails(p: PropiedadRow): string {
  const m2 = p.square_meters_area ? `${Math.round(p.square_meters_area)}m²` : null;
  const price = p.price_value
    ? `${p.price_type === 'USD' ? 'USD ' : '$'}${formatNumber(p.price_value)}`
    : 'Consultar con el vendedor';
  return [m2, price].filter(Boolean).join(' · ');
}

function computeScore(p: PropiedadRow): number {
  if (!p.square_meters_area || !p.price_value) return 72;
  const pricePerM2 = p.price_value / p.square_meters_area;
  const base = Math.round(100 - pricePerM2 / 80);
  return Math.max(62, Math.min(98, base));
}

function cleanDescription(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-AR').format(Math.round(n));
}

function buildSourceUrl(url: string | null): string {
  if (!url) return 'https://www.zonaprop.com.ar';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `https://www.argenprop.com${url}`;
  return url;
}

function sourceLabel(url: string | null): string {
  if (!url) return 'Zonaprop';
  if (url.includes('zonaprop')) return 'Zonaprop';
  if (url.includes('argenprop')) return 'Argenprop';
  return 'Portal';
}

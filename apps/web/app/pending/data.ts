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

const TYPES = ['VISITA A CONFIRMAR', 'MENSAJE POR APROBAR', 'PROPIEDAD ENCONTRADA', 'SOBRE PRESUPUESTO'];

const FULL_SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, description, description_summary';
const FALLBACK_SELECT =
  'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, description';

export async function fetchPendingCards(limit = 8): Promise<CardData[]> {
  const supabase = await createClient();
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
      urgent: i === 0,
    };
  });
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

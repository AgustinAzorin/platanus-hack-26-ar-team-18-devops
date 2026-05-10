import { notFound } from 'next/navigation';

import { getCurrentClientUserId } from '../../../lib/search/profile';
import { createServiceClient } from '../../../lib/supabase/service';

export const dynamic = 'force-dynamic';

import InformeClient from './informe-client';

interface FeedResultRow {
  id: string;
  posting_id: string;
  match_score: number | null;
  report_summary: string | null;
  report_highlights: { pros?: string[]; cons?: string[] } | null;
  created_at: string;
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
  description_summary: string | null;
}

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const userId = await getCurrentClientUserId();

  const { data: feedRow, error: feedError } = await supabase
    .from('feed_results')
    .select('id, posting_id, match_score, report_summary, report_highlights, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (feedError || !feedRow) notFound();

  const row = feedRow as FeedResultRow;

  const { data: propRow, error: propError } = await supabase
    .from('propiedades')
    .select(
      'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, parking, description, description_summary',
    )
    .eq('posting_id', row.posting_id)
    .single();

  if (propError || !propRow) notFound();

  const prop = propRow as PropiedadRow;

  const zonapropUrl = prop.url
    ? prop.url.startsWith('http')
      ? prop.url
      : `https://www.zonaprop.com.ar${prop.url}`
    : null;

  return (
    <InformeClient
      feedRowId={row.id}
      score={row.match_score ?? 0}
      summary={row.report_summary ?? null}
      pros={(row.report_highlights?.pros ?? []).slice(0, 5)}
      cons={(row.report_highlights?.cons ?? []).slice(0, 5)}
      createdAt={row.created_at}
      property={{
        posting_id: prop.posting_id,
        address: prop.address,
        neighborhood: prop.neighborhood,
        city: prop.city,
        price_value: prop.price_value,
        price_type: prop.price_type,
        expenses_value: prop.expenses_value,
        square_meters_area: prop.square_meters_area,
        rooms: prop.rooms,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        parking: prop.parking,
        image_urls: Array.isArray(prop.image_urls) ? prop.image_urls : [],
        description_summary: prop.description_summary ?? prop.description ?? null,
        zonapropUrl,
      }}
    />
  );
}

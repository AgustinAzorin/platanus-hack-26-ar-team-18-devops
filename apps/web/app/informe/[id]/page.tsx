import { notFound } from 'next/navigation';
import type { AnalysisReport } from '@repo/types';

import { createServiceClient } from '../../../lib/supabase/service';

import InformeClient from './informe-client';

export const dynamic = 'force-dynamic';

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

interface AnalysisRow {
  id: string;
  posting_id: string | null;
  score: number | null;
  report: AnalysisReport;
  created_at: string;
}

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  // The /informe URL param is `analyses.id` — the source of truth for reports.
  // We don't go through `feed_results` anymore; the feed list is built directly
  // from `analyses` so the id passed here always points at a real row.
  const { data: analysisData, error: analysisError } = await supabase
    .from('analyses')
    .select('id, posting_id, score, report, created_at')
    .eq('id', id)
    .maybeSingle();

  if (analysisError || !analysisData) notFound();

  const analysisRow = analysisData as AnalysisRow;
  if (!analysisRow.posting_id) notFound();

  const { data: propData, error: propError } = await supabase
    .from('propiedades')
    .select(
      'posting_id, url, image_urls, address, neighborhood, city, price_value, price_type, expenses_value, square_meters_area, rooms, bedrooms, bathrooms, parking, description, description_summary',
    )
    .eq('posting_id', analysisRow.posting_id)
    .single();

  if (propError || !propData) notFound();

  const prop = propData as PropiedadRow;

  const zonapropUrl = prop.url
    ? prop.url.startsWith('http')
      ? prop.url
      : `https://www.zonaprop.com.ar${prop.url}`
    : null;

  // analyses.score is on a 0–10 scale; rescale to 0–100 for the badge UI.
  const feedScore = Math.round((analysisRow.score ?? analysisRow.report.score ?? 0) * 10);

  return (
    <InformeClient
      feedRowId={analysisRow.id}
      feedScore={feedScore}
      analysisReport={analysisRow.report}
      analysisCreatedAt={analysisRow.created_at}
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

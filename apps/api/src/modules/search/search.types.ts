import { z } from 'zod';

export const SearchFiltersSchema = z.object({
  neighborhoods: z.array(z.string()),
  price_max: z.number().nullable(),
  price_currency: z.enum(['ARS', 'USD']),
  operation_type: z.enum(['venta', 'alquiler']),
  must_have_features: z.array(z.string()),
  min_score: z.number().int().min(1).max(10).nullable(),
  min_rooms: z.number().int().nullable(),
  max_rooms: z.number().int().nullable(),
  free_text_query: z.string().nullable(),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

export interface SearchResultItem {
  analysis_id: string;
  url: string;
  address: string | null;
  neighborhood: string | null;
  price_value: number | null;
  price_type: string | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters_area: number | null;
  score: number;
  resumen_ejecutivo: string;
  red_flags: string[];
  seller_whatsapp_digits: string | null;
  has_whatsapp: boolean | null;
}

export interface MetaReportRecommendation {
  analysis_id: string;
  razon: string;
}

export interface MetaReport {
  resumen_busqueda: string;
  top_recomendaciones: MetaReportRecommendation[];
  trade_offs: string[];
  alertas: string[];
}

export interface SearchResponse {
  query: string;
  filters: SearchFilters;
  results: SearchResultItem[];
  meta_report: MetaReport | null;
  notice: string | null;
}

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AnalysisReport } from '@repo/types';

import { VoyageClient } from '../../common/clients/voyage.client';
import type { Env } from '../../config/env.schema';
import { SupabaseService } from '../../supabase/supabase.service';

import type { SearchFilters, SearchResultItem } from './search.types';

const ANALYSES_TABLE = 'analyses';
const URL_PREFIX = 'https://www.zonaprop.com.ar';
const MAX_RESULTS = 30;
const PROPERTIES_FETCH_LIMIT = 200;

interface PropiedadFilteredRow {
  url: string | null;
  posting_id: string | number;
  address: string | null;
  neighborhood: string | null;
  price_value: number | null;
  price_type: string | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  square_meters_area: number | null;
  description: string | null;
  seller_whatsapp_digits: string | null;
  has_whatsapp: boolean | null;
}

interface AnalysisRow {
  id: string;
  url: string;
  report: AnalysisReport;
  score: number;
}

export interface ExecutorOutput {
  results: SearchResultItem[];
  notice: string | null;
}

@Injectable()
export class SearchExecutorService {
  private readonly logger = new Logger(SearchExecutorService.name);
  private readonly propertiesTable: string;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly voyage: VoyageClient,
    config: ConfigService<Env, true>,
  ) {
    this.propertiesTable = config.get('SUPABASE_PROPERTIES_TABLE', { infer: true });
  }

  async execute(filters: SearchFilters): Promise<ExecutorOutput> {
    if (filters.operation_type === 'venta') {
      return {
        results: [],
        notice:
          'La base de datos por ahora solo contiene propiedades en alquiler. Reformulá la búsqueda enfocada en alquiler o aclará el tipo de operación.',
      };
    }

    const properties = await this.queryProperties(filters);
    if (properties.length === 0) {
      return { results: [], notice: 'No se encontraron propiedades que matcheen los filtros estructurados.' };
    }

    // Cap the URL set we send to PostgREST: every URL goes into the IN(...) of
    // the analyses query, and ~150 URLs at ~100 chars each already approach the
    // 16 KB request-line limit and trigger `fetch failed`. We keep the first
    // chunk because `properties` is still in the order Supabase returned them,
    // which is good enough as a sample.
    const allUrls = Array.from(
      new Set(properties.map((p) => normalizeUrl(p.url)).filter((u): u is string => u !== null)),
    );
    if (allUrls.length === 0) {
      return { results: [], notice: 'Las propiedades encontradas no tienen URL válida para cruzar con análisis.' };
    }
    const URLS_QUERY_LIMIT = 80;
    const urls = allUrls.slice(0, URLS_QUERY_LIMIT);

    // Query analyses with optional vectorial ranking
    let analyses: AnalysisRow[];
    if (filters.free_text_query) {
      try {
        analyses = await this.queryAnalysesWithEmbedding(
          urls,
          filters.free_text_query,
          filters.min_score,
        );
      } catch (err) {
        this.logger.warn(
          `Vectorial search failed, falling back to score-based: ${(err as Error).message}`,
        );
        analyses = await this.queryAnalyses(urls, filters.min_score);
      }
    } else {
      analyses = await this.queryAnalyses(urls, filters.min_score);
    }

    const propertyByUrl = new Map<string, PropiedadFilteredRow>();
    for (const p of properties) {
      const norm = normalizeUrl(p.url);
      if (norm) propertyByUrl.set(norm, p);
    }
    const analysisByUrl = new Map<string, AnalysisRow>();
    for (const a of analyses) {
      analysisByUrl.set(a.url, a);
    }

    // ALWAYS merge analyzed + raw — never drop the un-analyzed candidates,
    // because the frontend's stage 4 enriches them. Order: analyzed first
    // (real score DESC), then raw (price ASC). Cap to MAX_RESULTS at the end.
    const analyzedUrls = analyses.map((a) => a.url).filter((u) => propertyByUrl.has(u));
    const rawUrls = Array.from(propertyByUrl.keys()).filter((u) => !analysisByUrl.has(u));

    rawUrls.sort((u1, u2) => {
      const p1 = propertyByUrl.get(u1)!;
      const p2 = propertyByUrl.get(u2)!;
      return (p1.price_value ?? Infinity) - (p2.price_value ?? Infinity);
    });

    const orderedUrls = [...analyzedUrls, ...rawUrls].slice(0, MAX_RESULTS);

    const merged: SearchResultItem[] = [];
    for (const url of orderedUrls) {
      const p = propertyByUrl.get(url);
      if (!p) continue;
      const a = analysisByUrl.get(url);
      merged.push(a ? toResultItem(a, p) : toResultItemFromProperty(p));
    }

    const rawCount = merged.filter((r) => r.analysis_id.startsWith('prop:')).length;
    const analysesNotice: string | null = rawCount > 0
      ? `${analyzedUrls.length} con análisis · ${rawCount} pendientes de análisis (la app las va a analizar a continuación).`
      : null;

    const filtered = applyFeatureFilter(merged, filters.must_have_features);

    let featureNotice: string | null = null;
    if (filtered.length === 0 && merged.length > 0 && filters.must_have_features.length > 0) {
      featureNotice = `No hay resultados que mencionen explícitamente: ${filters.must_have_features.join(', ')}. Mostrando lista sin ese filtro.`;
      filtered.push(...merged);
    }

    const notice = featureNotice ?? analysesNotice;

    // Results are already sorted by score (queryAnalyses) / similarity / price.
    return { results: filtered.slice(0, MAX_RESULTS), notice };
  }

  private async queryProperties(filters: SearchFilters): Promise<PropiedadFilteredRow[]> {
    let query = this.supabase.admin
      .from(this.propertiesTable)
      .select(
        'url, posting_id, address, neighborhood, price_value, price_type, rooms, bedrooms, bathrooms, parking, square_meters_area, description, seller_whatsapp_digits, has_whatsapp',
      )
      .not('url', 'is', null)
      // Only contactable listings — without a phone an agent can't message.
      .not('seller_whatsapp_digits', 'is', null)
      .limit(PROPERTIES_FETCH_LIMIT);

    // Neighborhoods: use ILIKE OR so "Palermo" matches "Palermo Hollywood",
    // "Palermo Soho", etc. The DB stores them as separate distinct values.
    if (filters.neighborhoods.length > 0) {
      const orClause = filters.neighborhoods
        .map((n) => `neighborhood.ilike.%${escapePgIlike(n)}%`)
        .join(',');
      query = query.or(orClause);
    }
    if (filters.price_max !== null) {
      query = query.lte('price_value', filters.price_max);
      // The DB stores ARS prices as price_type='$', not 'ARS'. Map our domain
      // value to the actual stored sentinel.
      const dbPriceType = filters.price_currency === 'USD' ? 'USD' : '$';
      query = query.eq('price_type', dbPriceType);
    }
    if (filters.min_rooms !== null) {
      query = query.gte('rooms', filters.min_rooms);
    }
    if (filters.max_rooms !== null) {
      query = query.lte('rooms', filters.max_rooms);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`failed to query propiedades: ${error.message}`);
      throw new InternalServerErrorException(`Failed to query properties: ${error.message}`);
    }
    return (data ?? []) as PropiedadFilteredRow[];
  }

  private async queryAnalyses(urls: string[], minScore: number | null): Promise<AnalysisRow[]> {
    let query = this.supabase.admin
      .from(ANALYSES_TABLE)
      .select('id, url, report, score')
      .in('url', urls)
      .order('score', { ascending: false })
      .limit(MAX_RESULTS);

    if (minScore !== null) {
      query = query.gte('score', minScore);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`failed to query analyses: ${error.message}`);
      throw new InternalServerErrorException(`Failed to query analyses: ${error.message}`);
    }
    return (data ?? []) as AnalysisRow[];
  }

  private async queryAnalysesWithEmbedding(
    urls: string[],
    freeTextQuery: string,
    minScore: number | null,
  ): Promise<AnalysisRow[]> {
    // Embed the free_text_query
    const queryEmbedding = await this.voyage.embed(freeTextQuery, 'query');

    // Convert embedding to string format for Supabase RPC or raw query
    // Using raw SQL with pgvector <==> operator for cosine similarity
    const { data, error } = await this.supabase.admin.rpc('search_analyses_by_embedding', {
      query_embedding: queryEmbedding,
      url_list: urls,
      min_score: minScore ?? 1,
      limit_results: MAX_RESULTS,
    });

    if (error) {
      // Fallback: if RPC doesn't exist, throw and let caller fall back to score-based search
      this.logger.warn(`Embedding search RPC failed: ${error.message}`);
      throw new Error(`Failed to query analyses with embedding: ${error.message}`);
    }

    return (data ?? []) as AnalysisRow[];
  }
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${URL_PREFIX}${url}`;
}

function toResultItem(a: AnalysisRow, p: PropiedadFilteredRow): SearchResultItem {
  return {
    analysis_id: a.id,
    url: a.url,
    address: p.address,
    neighborhood: p.neighborhood,
    price_value: p.price_value,
    price_type: p.price_type,
    rooms: p.rooms,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    square_meters_area: p.square_meters_area,
    score: a.score,
    resumen_ejecutivo: a.report.resumen_ejecutivo ?? '',
    red_flags: a.report.inmueble?.red_flags ?? [],
    seller_whatsapp_digits: p.seller_whatsapp_digits,
    has_whatsapp: p.has_whatsapp,
  };
}

/**
 * Build a SearchResultItem from raw property data when no AnalysisRow exists.
 * The `analysis_id` falls back to a stable synthetic id derived from the URL
 * so the frontend can still key lists/maps by it.
 */
function toResultItemFromProperty(p: PropiedadFilteredRow): SearchResultItem {
  const summary = (p.description ?? '').replace(/\s+/g, ' ').trim();
  const truncated = summary.length > 280 ? summary.slice(0, 277) + '…' : summary;
  // queryProperties already filters .not('url', 'is', null), so we can assert.
  const url = normalizeUrl(p.url) ?? '';
  return {
    analysis_id: `prop:${p.posting_id}`,
    url,
    address: p.address,
    neighborhood: p.neighborhood,
    price_value: p.price_value,
    price_type: p.price_type,
    rooms: p.rooms,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    square_meters_area: p.square_meters_area,
    score: 7, // neutral placeholder on the 0–10 scale
    resumen_ejecutivo: truncated || 'Sin descripción disponible.',
    red_flags: [],
    seller_whatsapp_digits: p.seller_whatsapp_digits,
    has_whatsapp: p.has_whatsapp,
  };
}

function applyFeatureFilter(items: SearchResultItem[], features: string[]): SearchResultItem[] {
  if (features.length === 0) return items;
  const needles = features.map((f) => stripAccents(f.toLowerCase()));
  return items.filter((it) => {
    const haystack = stripAccents(
      [it.address, it.neighborhood, it.resumen_ejecutivo, ...it.red_flags].filter(Boolean).join(' ').toLowerCase(),
    );
    return needles.every((n) => haystack.includes(n));
  });
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Escape characters that have meaning inside a PostgREST `or()` clause for
 * ilike: commas (separate filters) and parentheses (group). Backslashes the
 * usual `%` and `_` aren't escaped here — we use `%` ourselves around the
 * neighborhood term and accept that `_` matches any single char.
 */
function escapePgIlike(input: string): string {
  return input.replace(/([,()])/g, '\\$1');
}

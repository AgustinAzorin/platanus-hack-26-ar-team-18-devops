import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AnalysisReport } from '@repo/types';

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
    config: ConfigService<Env, true>,
  ) {
    this.propertiesTable = config.get('SUPABASE_PROPERTIES_TABLE', { infer: true });
  }

  async execute(filters: SearchFilters): Promise<ExecutorOutput> {
    if (filters.operation_type === 'alquiler') {
      return {
        results: [],
        notice:
          'La base de datos por ahora solo contiene propiedades en venta. Reformulá la búsqueda enfocada en venta o aclará el tipo de operación.',
      };
    }

    const properties = await this.queryProperties(filters);
    if (properties.length === 0) {
      return { results: [], notice: 'No se encontraron propiedades que matcheen los filtros estructurados.' };
    }

    const urls = Array.from(
      new Set(properties.map((p) => normalizeUrl(p.url)).filter((u): u is string => u !== null)),
    );
    if (urls.length === 0) {
      return { results: [], notice: 'Las propiedades encontradas no tienen URL válida para cruzar con análisis.' };
    }

    const analyses = await this.queryAnalyses(urls, filters.min_score);
    if (analyses.length === 0) {
      return {
        results: [],
        notice:
          'Las propiedades que matchean los filtros aún no tienen análisis generados. Probá ampliar criterios o esperá a que se procesen.',
      };
    }

    const propertyByUrl = new Map<string, PropiedadFilteredRow>();
    for (const p of properties) {
      const norm = normalizeUrl(p.url);
      if (norm) propertyByUrl.set(norm, p);
    }

    const merged: SearchResultItem[] = [];
    for (const a of analyses) {
      const p = propertyByUrl.get(a.url);
      if (!p) continue;
      merged.push(toResultItem(a, p));
    }

    const filtered = applyFeatureFilter(merged, filters.must_have_features);

    let notice: string | null = null;
    if (filtered.length === 0 && merged.length > 0 && filters.must_have_features.length > 0) {
      notice = `No hay resultados que mencionen explícitamente: ${filters.must_have_features.join(', ')}. Mostrando lista sin ese filtro.`;
      filtered.push(...merged);
    }

    filtered.sort((a, b) => b.score - a.score);
    return { results: filtered.slice(0, MAX_RESULTS), notice };
  }

  private async queryProperties(filters: SearchFilters): Promise<PropiedadFilteredRow[]> {
    let query = this.supabase.admin
      .from(this.propertiesTable)
      .select(
        'url, posting_id, address, neighborhood, price_value, price_type, rooms, bedrooms, bathrooms, parking, square_meters_area, description',
      )
      .not('url', 'is', null)
      .limit(PROPERTIES_FETCH_LIMIT);

    if (filters.neighborhoods.length > 0) {
      query = query.in('neighborhood', filters.neighborhoods);
    }
    if (filters.price_max !== null) {
      query = query.lte('price_value', filters.price_max).eq('price_type', filters.price_currency);
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

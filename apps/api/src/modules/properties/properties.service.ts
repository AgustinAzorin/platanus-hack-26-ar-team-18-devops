import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { PropertyData } from '@repo/types';

import type { Env } from '../../config/env.schema';
import { SupabaseService } from '../../supabase/supabase.service';

const IMAGE_SEP = '|';

interface PropiedadRow {
  url: string | null;
  posting_id: string | number;
  posting_type: string | null;
  address: string | null;
  neighborhood: string | null;
  location_label: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  price_value: number | null;
  price_type: string | null;
  expenses_value: number | null;
  expenses_type: string | null;
  square_meters_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  location: string | null;
  description: string | null;
  image_urls: string[] | string | null;
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);
  private readonly table: string;

  constructor(
    private readonly supabase: SupabaseService,
    config: ConfigService<Env, true>,
  ) {
    this.table = config.get('SUPABASE_PROPERTIES_TABLE', { infer: true });
  }

  async listNeighborhoods(): Promise<string[]> {
    const { data, error } = await this.supabase.admin
      .from(this.table)
      .select('neighborhood')
      .not('neighborhood', 'is', null)
      .order('neighborhood', { ascending: true });

    if (error) {
      this.logger.error(`failed to list neighborhoods: ${error.message}`);
      throw new Error(`Failed to load neighborhoods: ${error.message}`);
    }

    const seen = new Set<string>();
    for (const row of (data ?? []) as Array<{ neighborhood: string | null }>) {
      const value = row.neighborhood?.trim();
      if (value) seen.add(value);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b, 'es'));
  }

  async findByPostingId(posting_id: string): Promise<PropertyData> {
    const { data, error } = await this.supabase.admin
      .from(this.table)
      .select(
        'url, posting_id, posting_type, address, neighborhood, location_label, city, latitude, longitude, price_value, price_type, expenses_value, expenses_type, square_meters_area, rooms, bedrooms, bathrooms, parking, location, description, image_urls',
      )
      .eq('posting_id', posting_id)
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error(`failed to fetch property ${posting_id}: ${error.message}`);
      throw new Error(`Failed to query properties: ${error.message}`);
    }
    if (!data) {
      throw new NotFoundException(
        `No existe una propiedad con posting_id "${posting_id}"`,
      );
    }

    return this.toPropertyData(data as PropiedadRow);
  }

  async findFirstByNeighborhood(neighborhood: string): Promise<PropertyData> {
    const { data, error } = await this.supabase.admin
      .from(this.table)
      .select(
        'url, posting_id, posting_type, address, neighborhood, location_label, city, latitude, longitude, price_value, price_type, expenses_value, expenses_type, square_meters_area, rooms, bedrooms, bathrooms, parking, location, description, image_urls',
      )
      .eq('neighborhood', neighborhood)
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error(`failed to fetch property for ${neighborhood}: ${error.message}`);
      throw new Error(`Failed to query properties: ${error.message}`);
    }
    if (!data) {
      throw new NotFoundException(
        `No hay propiedades cargadas para el barrio "${neighborhood}"`,
      );
    }

    return this.toPropertyData(data as PropiedadRow);
  }

  toScrapedForClaude(property: PropertyData): Record<string, unknown> {
    return {
      url: property.url,
      posting_id: property.posting_id,
      direccion: property.address,
      barrio: property.neighborhood,
      ciudad: property.city,
      precio: property.price_value
        ? { moneda: property.price_type ?? 'ARS', valor: property.price_value }
        : null,
      expensas: property.expenses_value
        ? { moneda: property.expenses_type ?? 'ARS', valor: property.expenses_value }
        : null,
      superficie_total_m2: property.square_meters_area,
      ambientes: property.rooms,
      dormitorios: property.bedrooms,
      banos: property.bathrooms,
      cocheras: property.parking,
      descripcion: property.description,
      cantidad_fotos: property.image_urls.length,
      urls_fotos: property.image_urls,
    };
  }

  private toPropertyData(row: PropiedadRow): PropertyData {
    return {
      posting_id: String(row.posting_id),
      url: row.url,
      address: row.address,
      neighborhood: row.neighborhood,
      city: row.city,
      price_value: numberOrNull(row.price_value),
      price_type: row.price_type,
      expenses_value: numberOrNull(row.expenses_value),
      expenses_type: row.expenses_type,
      square_meters_area: numberOrNull(row.square_meters_area),
      rooms: numberOrNull(row.rooms),
      bedrooms: numberOrNull(row.bedrooms),
      bathrooms: numberOrNull(row.bathrooms),
      parking: numberOrNull(row.parking),
      description: row.description,
      image_urls: parseImageUrls(row.image_urls),
    };
  }
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseImageUrls(value: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((u): u is string => typeof u === 'string' && u.length > 0);
  return value
    .split(IMAGE_SEP)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}

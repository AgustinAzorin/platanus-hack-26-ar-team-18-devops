import { Injectable, Logger } from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';

import type { EnvironmentData } from './environment.types';

const TABLE = 'environment_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function roundGrid(coord: number): number {
  return Math.round(coord * 1000) / 1000;
}

interface CacheRow {
  lat_grid: number;
  lng_grid: number;
  data: EnvironmentData;
  created_at: string;
}

@Injectable()
export class EnvironmentCacheService {
  private readonly logger = new Logger(EnvironmentCacheService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async get(lat: number, lng: number): Promise<EnvironmentData | null> {
    const latGrid = roundGrid(lat);
    const lngGrid = roundGrid(lng);
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();

    const { data, error } = await this.supabase.admin
      .from(TABLE)
      .select('data, created_at')
      .eq('lat_grid', latGrid)
      .eq('lng_grid', lngGrid)
      .gte('created_at', cutoff)
      .maybeSingle();

    if (error) {
      this.logger.warn(`cache read error: ${error.message}`);
      return null;
    }
    return (data as CacheRow | null)?.data ?? null;
  }

  async set(lat: number, lng: number, envData: EnvironmentData): Promise<void> {
    const latGrid = roundGrid(lat);
    const lngGrid = roundGrid(lng);

    const { error } = await this.supabase.admin.from(TABLE).upsert(
      { lat_grid: latGrid, lng_grid: lngGrid, data: envData },
      { onConflict: 'lat_grid,lng_grid' },
    );

    if (error) {
      this.logger.warn(`cache write error: ${error.message}`);
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import type {
  AnalysisReport,
  AnalyzePropertyResponse,
  PropertyData,
} from '@repo/types';

import { SupabaseService } from '../../supabase/supabase.service';
import { PropertiesService } from '../properties/properties.service';

import { ClaudeClient } from './claude.client';

const ANALYSES_TABLE = 'analyses';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface AnalysisRow {
  id: string;
  url: string;
  scraped_data: PropertyData;
  report: AnalysisReport;
  score: number;
  created_at: string;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly properties: PropertiesService,
    private readonly claude: ClaudeClient,
  ) {}

  async analyzeByNeighborhood(neighborhood: string): Promise<AnalyzePropertyResponse> {
    const property = await this.properties.findFirstByNeighborhood(neighborhood);
    const cacheKey = property.url ?? `posting:${property.posting_id}`;

    const cached = await this.findFreshCached(cacheKey);
    if (cached) {
      this.logger.log(`cache hit for ${cacheKey} (id=${cached.id})`);
      return {
        id: cached.id,
        url: cached.url,
        cached: true,
        created_at: cached.created_at,
        report: cached.report,
        property,
      };
    }

    const scrapedForClaude = this.properties.toScrapedForClaude(property);

    let report: AnalysisReport;
    try {
      report = await this.claude.analyzeProperty(
        scrapedForClaude,
        property.url ?? cacheKey,
      );
    } catch (err) {
      this.logger.error(`claude failed for ${cacheKey}: ${(err as Error).message}`);
      throw new InternalServerErrorException(
        `Failed to generate analysis: ${(err as Error).message}`,
      );
    }

    const persisted = await this.persist(cacheKey, property, report);
    return {
      id: persisted.id,
      url: persisted.url,
      cached: false,
      created_at: persisted.created_at,
      report: persisted.report,
      property,
    };
  }

  private async findFreshCached(url: string): Promise<AnalysisRow | null> {
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data, error } = await this.supabase.admin
      .from(ANALYSES_TABLE)
      .select('id, url, scraped_data, report, score, created_at')
      .eq('url', url)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.warn(`cache lookup failed: ${error.message}`);
      return null;
    }
    return (data as AnalysisRow | null) ?? null;
  }

  private async persist(
    url: string,
    property: PropertyData,
    report: AnalysisReport,
  ): Promise<AnalysisRow> {
    const { data, error } = await this.supabase.admin
      .from(ANALYSES_TABLE)
      .insert({
        url,
        scraped_data: property,
        report,
        score: report.score,
      })
      .select('id, url, scraped_data, report, score, created_at')
      .single();

    if (error || !data) {
      this.logger.error(`failed to persist analysis: ${error?.message ?? 'unknown'}`);
      throw new InternalServerErrorException('Failed to persist analysis');
    }
    return data as AnalysisRow;
  }
}

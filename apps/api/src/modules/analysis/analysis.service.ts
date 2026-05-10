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

import { VoyageClient } from '../../common/clients/voyage.client';
import { SupabaseService } from '../../supabase/supabase.service';
import { EnvironmentService } from '../environment/environment.service';
import { PropertiesService } from '../properties/properties.service';

import { ClaudeClient } from './claude.client';

const ANALYSES_TABLE = 'analyses';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface AnalysisRow {
  id: string;
  url: string;
  posting_id: string | null;
  scraped_data: PropertyData;
  report: AnalysisReport;
  score: number;
  created_at: string;
  visual_description?: string;
  visual_embedding?: number[];
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly properties: PropertiesService,
    private readonly claude: ClaudeClient,
    private readonly environment: EnvironmentService,
    private readonly voyage: VoyageClient,
  ) {}

  async analyzeByPostingId(posting_id: string): Promise<AnalyzePropertyResponse> {
    const property = await this.properties.findByPostingId(posting_id);
    return this.analyzeProperty(property);
  }

  async analyzeByNeighborhood(neighborhood: string): Promise<AnalyzePropertyResponse> {
    const property = await this.properties.findFirstByNeighborhood(neighborhood);
    return this.analyzeProperty(property);
  }

  private async analyzeProperty(property: PropertyData): Promise<AnalyzePropertyResponse> {
    // Ensure URL has correct format with zonaprop.com.ar prefix
    const fullUrl = property.url
      ? property.url.startsWith('http')
        ? property.url
        : `https://www.zonaprop.com.ar${property.url}`
      : `https://www.zonaprop.com.ar/propiedad/${property.posting_id}`;

    // Prefer cached row by posting_id (most specific), fall back to URL lookup
    // for analyses persisted before the posting_id column existed.
    const cached =
      (await this.findFreshCachedByPostingId(property.posting_id)) ??
      (await this.findFreshCached(fullUrl));
    if (cached) {
      this.logger.log(`cache hit for posting_id=${property.posting_id} (id=${cached.id})`);
      const correctedProperty = {
        ...cached.scraped_data,
        url: cached.url.startsWith('http') ? cached.url : `https://www.zonaprop.com.ar${cached.url}`,
      };
      return {
        id: cached.id,
        url: cached.url,
        cached: true,
        created_at: cached.created_at,
        report: cached.report,
        property: correctedProperty,
      };
    }

    const scrapedForClaude = this.properties.toScrapedForClaude(property);

    const envData = await this.environment.getEnvironmentData(
      property.address ?? property.neighborhood ?? '',
      property.neighborhood ?? undefined,
    );
    const environmentNarrative = this.environment.formatForPrompt(envData);
    this.logger.log(`environment data ready for posting_id=${property.posting_id}${envData.error ? ` (partial: ${envData.error})` : ''}`);

    let report: AnalysisReport;
    try {
      report = await this.claude.analyzeProperty(
        scrapedForClaude,
        fullUrl,
        environmentNarrative,
      );
    } catch (err) {
      this.logger.error(`claude failed for posting_id=${property.posting_id}: ${(err as Error).message}`);
      throw new InternalServerErrorException(
        `Failed to generate analysis: ${(err as Error).message}`,
      );
    }

    let visualEmbedding: number[] | null = null;
    if (report.visual_description) {
      try {
        visualEmbedding = await this.voyage.embed(report.visual_description, 'document');
      } catch (err) {
        this.logger.warn(
          `Failed to generate visual embedding for posting_id=${property.posting_id}: ${(err as Error).message}. Continuing without embedding.`,
        );
      }
    }

    const persisted = await this.persist(fullUrl, property, report, visualEmbedding);
    return {
      id: persisted.id,
      url: persisted.url,
      cached: false,
      created_at: persisted.created_at,
      report: persisted.report,
      property: {
        ...property,
        url: fullUrl,
      },
    };
  }

  private async findFreshCachedByPostingId(posting_id: string): Promise<AnalysisRow | null> {
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data, error } = await this.supabase.admin
      .from(ANALYSES_TABLE)
      .select('id, url, posting_id, scraped_data, report, score, created_at')
      .eq('posting_id', posting_id)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.warn(`cache lookup by posting_id failed: ${error.message}`);
      return null;
    }
    return (data as AnalysisRow | null) ?? null;
  }

  private async findFreshCached(url: string): Promise<AnalysisRow | null> {
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data, error } = await this.supabase.admin
      .from(ANALYSES_TABLE)
      .select('id, url, posting_id, scraped_data, report, score, created_at')
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
    visualEmbedding?: number[] | null,
  ): Promise<AnalysisRow> {
    const insertData: Record<string, unknown> = {
      url,
      posting_id: property.posting_id,
      scraped_data: property,
      report,
      score: report.score,
    };

    if (report.visual_description) {
      insertData.visual_description = report.visual_description;
    }

    if (visualEmbedding) {
      insertData.visual_embedding = visualEmbedding;
    }

    const { data, error } = await this.supabase.admin
      .from(ANALYSES_TABLE)
      .insert(insertData)
      .select('id, url, posting_id, scraped_data, report, score, created_at, visual_description, visual_embedding')
      .single();

    if (error || !data) {
      this.logger.error(`failed to persist analysis: ${error?.message ?? 'unknown'}`);
      throw new InternalServerErrorException('Failed to persist analysis');
    }
    return data as AnalysisRow;
  }
}

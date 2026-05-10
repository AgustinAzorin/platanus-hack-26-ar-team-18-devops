import { Injectable, Logger } from '@nestjs/common';

import { VoyageClient } from '../../common/clients/voyage.client';
import { SupabaseService } from '../../supabase/supabase.service';

const ANALYSES_TABLE = 'analyses';

interface BackfillRow {
  id: string;
  visual_description: string;
}

interface BackfillResult {
  processed: number;
  failed: number;
}

@Injectable()
export class BackfillEmbeddingsService {
  private readonly logger = new Logger(BackfillEmbeddingsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly voyage: VoyageClient,
  ) {}

  async backfillEmbeddings(limit: number = 10): Promise<BackfillResult> {
    // Validate limit
    const actualLimit = Math.min(Math.max(limit, 1), 50);

    // Fetch rows with visual_description but no visual_embedding
    const { data, error } = await this.supabase.admin
      .from(ANALYSES_TABLE)
      .select('id, visual_description')
      .not('visual_description', 'is', null)
      .is('visual_embedding', null)
      .limit(actualLimit);

    if (error) {
      this.logger.error(`Failed to fetch rows for backfill: ${error.message}`);
      throw new Error(`Failed to fetch rows for backfill: ${error.message}`);
    }

    const rows = (data ?? []) as BackfillRow[];
    this.logger.log(`Starting backfill of ${rows.length} rows (limit=${actualLimit})`);

    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const embedding = await this.voyage.embed(row.visual_description, 'document');

        const { error: updateError } = await this.supabase.admin
          .from(ANALYSES_TABLE)
          .update({ visual_embedding: embedding })
          .eq('id', row.id);

        if (updateError) {
          this.logger.warn(
            `Failed to update embedding for row ${row.id}: ${updateError.message}`,
          );
          failed++;
        } else {
          processed++;
          this.logger.debug(`Embedded row ${row.id}`);
        }
      } catch (err) {
        this.logger.warn(
          `Failed to generate embedding for row ${row.id}: ${(err as Error).message}`,
        );
        failed++;
      }
    }

    this.logger.log(`Backfill complete: processed=${processed}, failed=${failed}`);
    return { processed, failed };
  }
}

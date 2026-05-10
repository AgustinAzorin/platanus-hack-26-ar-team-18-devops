import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { SearchExecutorService } from './search-executor.service';
import { SearchSummarizerService } from './search-summarizer.service';
import { SearchTranslatorService } from './search-translator.service';
import type { SearchFilters, SearchResponse } from './search.types';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly translator: SearchTranslatorService,
    private readonly executor: SearchExecutorService,
    private readonly summarizer: SearchSummarizerService,
  ) {}

  async search(query: string): Promise<SearchResponse> {
    let filters: SearchFilters;
    try {
      filters = await this.translator.translate(query);
    } catch (err) {
      this.logger.error(`translation failed: ${(err as Error).message}`);
      throw new BadRequestException(
        'No pude interpretar la consulta. Reformulala con más detalle (barrios, precio, ambientes).',
      );
    }

    if (!hasAnyCriterion(filters)) {
      return {
        query,
        filters,
        results: [],
        meta_report: null,
        notice:
          'La consulta no contiene criterios filtables. Aclará barrios, presupuesto, ambientes o features que te importan.',
      };
    }

    const { results, notice: executorNotice } = await this.executor.execute(filters);

    if (results.length === 0) {
      return {
        query,
        filters,
        results: [],
        meta_report: null,
        notice: executorNotice ?? 'No hay resultados para los criterios indicados.',
      };
    }

    let metaReport = null;
    try {
      metaReport = await this.summarizer.summarize(query, filters, results);
    } catch (err) {
      this.logger.warn(`summarizer failed, returning results without meta-report: ${(err as Error).message}`);
    }

    return {
      query,
      filters,
      results,
      meta_report: metaReport,
      notice: executorNotice,
    };
  }
}

function hasAnyCriterion(f: SearchFilters): boolean {
  return (
    f.neighborhoods.length > 0 ||
    f.price_max !== null ||
    f.must_have_features.length > 0 ||
    f.min_score !== null ||
    f.min_rooms !== null ||
    f.max_rooms !== null ||
    (f.free_text_query !== null && f.free_text_query.trim().length > 0)
  );
}

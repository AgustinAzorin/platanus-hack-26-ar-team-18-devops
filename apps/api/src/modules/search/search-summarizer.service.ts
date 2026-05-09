import { Injectable, Logger } from '@nestjs/common';

import { SearchClaudeClient } from './claude.client';
import type { MetaReport, SearchFilters, SearchResultItem } from './search.types';

@Injectable()
export class SearchSummarizerService {
  private readonly logger = new Logger(SearchSummarizerService.name);

  constructor(private readonly claude: SearchClaudeClient) {}

  async summarize(
    query: string,
    filters: SearchFilters,
    results: SearchResultItem[],
  ): Promise<MetaReport> {
    this.logger.log(`summarizing ${results.length} results for query: ${query}`);
    return this.claude.summarize(query, filters, results);
  }
}

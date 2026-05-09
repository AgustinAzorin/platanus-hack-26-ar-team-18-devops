import { Injectable, Logger } from '@nestjs/common';

import { SearchClaudeClient } from './claude.client';
import type { SearchFilters } from './search.types';

@Injectable()
export class SearchTranslatorService {
  private readonly logger = new Logger(SearchTranslatorService.name);

  constructor(private readonly claude: SearchClaudeClient) {}

  async translate(query: string): Promise<SearchFilters> {
    this.logger.log(`translating query: ${query}`);
    const filters = await this.claude.translateQuery(query);
    this.logger.log(
      `filters: neighborhoods=${filters.neighborhoods.length} price_max=${filters.price_max} ` +
        `currency=${filters.price_currency} op=${filters.operation_type} ` +
        `must_have=${filters.must_have_features.length} min_score=${filters.min_score} ` +
        `rooms=${filters.min_rooms ?? '*'}-${filters.max_rooms ?? '*'} ` +
        `free_text=${filters.free_text_query ? 'yes' : 'no'}`,
    );
    return filters;
  }
}

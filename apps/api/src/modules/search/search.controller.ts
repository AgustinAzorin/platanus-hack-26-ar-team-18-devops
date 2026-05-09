import { Body, Controller, Post } from '@nestjs/common';

import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';
import type { SearchResponse } from './search.types';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Post('query')
  async query(@Body() dto: SearchQueryDto): Promise<SearchResponse> {
    return this.search.search(dto.query);
  }
}

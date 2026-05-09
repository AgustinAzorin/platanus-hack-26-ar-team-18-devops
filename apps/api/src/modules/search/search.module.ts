import { Module } from '@nestjs/common';

import { VoyageClient } from '../../common/clients/voyage.client';
import { SearchClaudeClient } from './claude.client';
import { SearchController } from './search.controller';
import { SearchExecutorService } from './search-executor.service';
import { SearchService } from './search.service';
import { SearchSummarizerService } from './search-summarizer.service';
import { SearchTranslatorService } from './search-translator.service';

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    SearchTranslatorService,
    SearchExecutorService,
    SearchSummarizerService,
    SearchClaudeClient,
    VoyageClient,
  ],
  exports: [SearchService],
})
export class SearchModule {}

import { Module } from '@nestjs/common';

import { ScraperModule } from '../scraper/scraper.module';

import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ClaudeClient } from './claude.client';

@Module({
  imports: [ScraperModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, ClaudeClient],
  exports: [AnalysisService],
})
export class AnalysisModule {}

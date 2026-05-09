import { Module } from '@nestjs/common';

import { PropertiesModule } from '../properties/properties.module';

import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ClaudeClient } from './claude.client';

@Module({
  imports: [PropertiesModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, ClaudeClient],
  exports: [AnalysisService],
})
export class AnalysisModule {}

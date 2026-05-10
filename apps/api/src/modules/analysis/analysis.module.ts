import { Module } from '@nestjs/common';

import { VoyageClient } from '../../common/clients/voyage.client';
import { EnvironmentModule } from '../environment/environment.module';
import { PropertiesModule } from '../properties/properties.module';

import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { BackfillEmbeddingsService } from './backfill-embeddings.service';
import { ClaudeClient } from './claude.client';

@Module({
  imports: [PropertiesModule, EnvironmentModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, ClaudeClient, VoyageClient, BackfillEmbeddingsService],
  exports: [AnalysisService],
})
export class AnalysisModule {}

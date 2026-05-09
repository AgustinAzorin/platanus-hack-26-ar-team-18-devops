import { Module } from '@nestjs/common';

import { EnvironmentModule } from '../environment/environment.module';
import { PropertiesModule } from '../properties/properties.module';

import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ClaudeClient } from './claude.client';

@Module({
  imports: [PropertiesModule, EnvironmentModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, ClaudeClient],
  exports: [AnalysisService],
})
export class AnalysisModule {}

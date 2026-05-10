import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AnalyzePropertyResponse, NeighborhoodsResponse } from '@repo/types';

import { PropertiesService } from '../properties/properties.service';

import { AnalysisService } from './analysis.service';
import { AnalyzePropertyDto } from './dto/analyze-property.dto';
import { BackfillEmbeddingsService } from './backfill-embeddings.service';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysis: AnalysisService,
    private readonly properties: PropertiesService,
    private readonly backfill: BackfillEmbeddingsService,
  ) {}

  @Get('neighborhoods')
  @ApiOperation({ summary: 'List distinct neighborhoods available in the properties table' })
  neighborhoods(): Promise<NeighborhoodsResponse> {
    return this.properties.listNeighborhoods();
  }

  @Post('analyze')
  @ApiOperation({
    summary:
      'Analyze a property. Pass `posting_id` to target a specific property; ' +
      '`neighborhood` falls back to the first property in that neighborhood.',
  })
  analyze(@Body() body: AnalyzePropertyDto): Promise<AnalyzePropertyResponse> {
    if (body.posting_id) {
      return this.analysis.analyzeByPostingId(body.posting_id);
    }
    return this.analysis.analyzeByNeighborhood(body.neighborhood as string);
  }

  @Post('backfill-embeddings')
  @ApiOperation({ summary: 'Generate embeddings for analyses with visual_description but no visual_embedding' })
  backfillEmbeddings(@Query('limit') limit?: string): Promise<{ processed: number; failed: number }> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 10;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    return this.backfill.backfillEmbeddings(safeLimit);
  }
}

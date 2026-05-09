import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AnalyzePropertyResponse, NeighborhoodsResponse } from '@repo/types';

import { PropertiesService } from '../properties/properties.service';

import { AnalysisService } from './analysis.service';
import { AnalyzePropertyDto } from './dto/analyze-property.dto';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysis: AnalysisService,
    private readonly properties: PropertiesService,
  ) {}

  @Get('neighborhoods')
  @ApiOperation({ summary: 'List distinct neighborhoods available in the properties table' })
  neighborhoods(): Promise<NeighborhoodsResponse> {
    return this.properties.listNeighborhoods();
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze the first property found for a given neighborhood' })
  analyze(@Body() body: AnalyzePropertyDto): Promise<AnalyzePropertyResponse> {
    return this.analysis.analyzeByNeighborhood(body.neighborhood);
  }
}

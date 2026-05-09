import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AnalysisService } from './analysis.service';
import { AnalyzePropertyDto } from './dto/analyze-property.dto';
import type { AnalyzePropertyResponse } from './analysis.types';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze a real-estate listing URL and return a due-diligence report' })
  analyze(@Body() body: AnalyzePropertyDto): Promise<AnalyzePropertyResponse> {
    return this.analysis.analyze(body.url);
  }
}

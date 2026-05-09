import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import type { EvidenceModel } from './evidence.model';

@ApiTags('evidence')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Get()
  @ApiOperation({ summary: 'List evidence (paginated, optional workId/type filters)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
    @Query('workId') workId?: string,
    @Query('type') type?: string,
  ): Promise<EvidenceModel[]> {
    return this.evidence.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
      workId,
      type,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<EvidenceModel> {
    return this.evidence.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Upload evidence for a work' })
  create(@Body() body: CreateEvidenceDto): Promise<EvidenceModel> {
    return this.evidence.create(body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete evidence' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.evidence.delete(id);
  }
}

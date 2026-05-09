import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

import { RecordingsService } from './recordings.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import type { RecordingModel } from './recordings.model';

@ApiTags('recordings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordings: RecordingsService) {}

  @Get()
  @ApiOperation({ summary: 'List recordings (paginated, optional workId filter)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
    @Query('workId') workId?: string,
  ): Promise<RecordingModel[]> {
    return this.recordings.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
      workId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recording by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<RecordingModel> {
    return this.recordings.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a recording' })
  create(@Body() body: CreateRecordingDto): Promise<RecordingModel> {
    return this.recordings.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recording' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRecordingDto,
  ): Promise<RecordingModel> {
    return this.recordings.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recording' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.recordings.delete(id);
  }
}

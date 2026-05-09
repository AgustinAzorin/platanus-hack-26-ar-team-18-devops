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

import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { CreateWorkContributorDto } from './dto/create-work-contributor.dto';
import { UpdateWorkContributorDto } from './dto/update-work-contributor.dto';
import type { WorkModel, WorkContributorModel } from './works.model';
import { WorksService } from './works.service';

@ApiTags('works')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('works')
export class WorksController {
  constructor(private readonly works: WorksService) {}

  @Get()
  @ApiOperation({ summary: 'List works (paginated, optional artistId filter)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
    @Query('artistId') artistId?: string,
  ): Promise<WorkModel[]> {
    return this.works.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
      artistId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<WorkModel> {
    return this.works.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a work' })
  create(@Body() body: CreateWorkDto): Promise<WorkModel> {
    return this.works.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWorkDto,
  ): Promise<WorkModel> {
    return this.works.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a work' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.works.delete(id);
  }

  @Get(':workId/contributors')
  @ApiOperation({ summary: 'List contributors for a work' })
  listContributors(@Param('workId', ParseUUIDPipe) workId: string): Promise<WorkContributorModel[]> {
    return this.works.listContributors(workId);
  }

  @Post(':workId/contributors')
  @ApiOperation({ summary: 'Add a contributor to a work' })
  createContributor(
    @Param('workId', ParseUUIDPipe) workId: string,
    @Body() body: CreateWorkContributorDto,
  ): Promise<WorkContributorModel> {
    return this.works.createContributor({ ...body, workId });
  }

  @Patch(':workId/contributors/:id')
  @ApiOperation({ summary: 'Update a work contributor' })
  updateContributor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWorkContributorDto,
  ): Promise<WorkContributorModel> {
    return this.works.updateContributor(id, body);
  }

  @Delete(':workId/contributors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a contributor from a work' })
  deleteContributor(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.works.deleteContributor(id);
  }
}

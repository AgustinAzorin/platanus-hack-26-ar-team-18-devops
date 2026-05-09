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

import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import type { ArtistModel } from './artists.model';

@ApiTags('artists')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get()
  @ApiOperation({ summary: 'List artists (paginated)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
  ): Promise<ArtistModel[]> {
    return this.artists.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an artist by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ArtistModel> {
    return this.artists.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an artist' })
  create(@Body() body: CreateArtistDto): Promise<ArtistModel> {
    return this.artists.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an artist' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateArtistDto,
  ): Promise<ArtistModel> {
    return this.artists.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an artist' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.artists.delete(id);
  }
}

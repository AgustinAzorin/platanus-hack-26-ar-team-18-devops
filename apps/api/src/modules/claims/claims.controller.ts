import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { CreateClaimMessageDto } from './dto/create-claim-message.dto';
import type { ClaimModel, ClaimMessageModel } from './claims.model';

@ApiTags('claims')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Get()
  @ApiOperation({ summary: 'List claims (paginated, optional status/workId filters)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
    @Query('status') status?: string,
    @Query('workId') workId?: string,
  ): Promise<ClaimModel[]> {
    return this.claims.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
      status,
      workId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a claim by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ClaimModel> {
    return this.claims.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a claim' })
  create(@Body() body: CreateClaimDto): Promise<ClaimModel> {
    return this.claims.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a claim (status, match signals, etc.)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateClaimDto,
  ): Promise<ClaimModel> {
    return this.claims.update(id, body);
  }

  @Get(':claimId/messages')
  @ApiOperation({ summary: 'List messages for a claim' })
  listMessages(@Param('claimId', ParseUUIDPipe) claimId: string): Promise<ClaimMessageModel[]> {
    return this.claims.listMessages(claimId);
  }

  @Post(':claimId/messages')
  @ApiOperation({ summary: 'Add a message to a claim' })
  createMessage(
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() body: CreateClaimMessageDto,
  ): Promise<ClaimMessageModel> {
    return this.claims.createMessage({ ...body, claimId });
  }
}

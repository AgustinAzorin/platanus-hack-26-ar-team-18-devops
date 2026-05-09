import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

import { BotLogService } from './bot-log.service';
import { CreateBotLogDto } from './dto/create-bot-log.dto';
import type { BotLogModel } from './bot-log.model';

@ApiTags('bot-log')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('bot-log')
export class BotLogController {
  constructor(private readonly botLog: BotLogService) {}

  @Get()
  @ApiOperation({ summary: 'List bot activity logs (paginated, optional kind filter)' })
  list(
    @Query('take') take = '50',
    @Query('skip') skip = '0',
    @Query('kind') kind?: string,
  ): Promise<BotLogModel[]> {
    return this.botLog.list({
      take: Math.min(parseInt(take, 10) || 50, 200),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
      kind,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Append a bot activity log entry' })
  create(@Body() body: CreateBotLogDto): Promise<BotLogModel> {
    return this.botLog.create(body);
  }
}

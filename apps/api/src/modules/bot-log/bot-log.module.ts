import { Module } from '@nestjs/common';

import { BotLogController } from './bot-log.controller';
import { BotLogRepository } from './bot-log.repository';
import { BotLogService } from './bot-log.service';

@Module({
  controllers: [BotLogController],
  providers: [BotLogService, BotLogRepository],
  exports: [BotLogService],
})
export class BotLogModule {}

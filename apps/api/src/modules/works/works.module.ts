import { Module } from '@nestjs/common';

import { WorksController } from './works.controller';
import { WorksRepository } from './works.repository';
import { WorksService } from './works.service';

@Module({
  controllers: [WorksController],
  providers: [WorksService, WorksRepository],
  exports: [WorksService],
})
export class WorksModule {}

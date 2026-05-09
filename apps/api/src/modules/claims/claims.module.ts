import { Module } from '@nestjs/common';

import { ClaimsController } from './claims.controller';
import { ClaimsRepository } from './claims.repository';
import { ClaimsService } from './claims.service';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsRepository],
  exports: [ClaimsService],
})
export class ClaimsModule {}

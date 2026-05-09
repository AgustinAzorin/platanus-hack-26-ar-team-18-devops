import { Module } from '@nestjs/common';

import { EvidenceController } from './evidence.controller';
import { EvidenceRepository } from './evidence.repository';
import { EvidenceService } from './evidence.service';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, EvidenceRepository],
  exports: [EvidenceService],
})
export class EvidenceModule {}

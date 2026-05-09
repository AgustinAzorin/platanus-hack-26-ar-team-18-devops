import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ArtistsModule } from './modules/artists/artists.module';
import { WorksModule } from './modules/works/works.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { RecordingsModule } from './modules/recordings/recordings.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { BotLogModule } from './modules/bot-log/bot-log.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UsersModule,
    ArtistsModule,
    WorksModule,
    ClaimsModule,
    EvidenceModule,
    RecordingsModule,
    ContractsModule,
    BotLogModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}

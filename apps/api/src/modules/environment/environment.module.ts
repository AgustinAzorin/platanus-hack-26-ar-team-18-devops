import { Module } from '@nestjs/common';

import { EnvironmentCacheService } from './environment-cache.service';
import { EnvironmentService } from './environment.service';
import { NominatimClient } from './nominatim.client';
import { OverpassClient } from './overpass.client';

@Module({
  providers: [EnvironmentService, EnvironmentCacheService, NominatimClient, OverpassClient],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}

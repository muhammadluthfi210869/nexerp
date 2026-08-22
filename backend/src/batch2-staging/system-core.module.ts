import { Global, Module } from '@nestjs/common';
import { IdGeneratorService } from '../modules/system/id-generator.service';
import { CacheService } from '../shared/cache.service';

/**
 * Minimal global provider of the few shared "system" services that the
 * Batch 2 golden-flow modules (Bussdev / Rnd / Scm / Legality) depend on.
 *
 * In the full application these live inside the broken SystemModule (which
 * also imports the broken Creative/Warehouse modules). We extract ONLY the
 * genuinely required, real, self-contained services here so the vertical
 * slice can boot without touching the broken modules.
 *
 * @Global so any real module in the slice can inject them.
 */
@Global()
@Module({
  providers: [IdGeneratorService, CacheService],
  exports: [IdGeneratorService, CacheService],
})
export class SystemCoreModule {}

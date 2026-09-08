import { Module } from '@nestjs/common';
import { AssetDisposalsService } from './asset-disposals.service';
import { AssetDisposalsController } from './asset-disposals.controller';

@Module({
  controllers: [AssetDisposalsController],
  providers: [AssetDisposalsService],
  exports: [AssetDisposalsService],
})
export class AssetDisposalsModule {}

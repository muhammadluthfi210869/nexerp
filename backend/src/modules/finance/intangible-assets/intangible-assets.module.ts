import { Module } from '@nestjs/common';
import { IntangibleAssetsService } from './intangible-assets.service';
import { IntangibleAssetsController } from './intangible-assets.controller';

@Module({
  controllers: [IntangibleAssetsController],
  providers: [IntangibleAssetsService],
  exports: [IntangibleAssetsService],
})
export class IntangibleAssetsModule {}

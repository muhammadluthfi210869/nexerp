import { Module } from '@nestjs/common';
import { LostDealsService } from './lost-deals/lost-deals.service';
import { LostDealsController } from './lost-deals/lost-deals.controller';

@Module({
  providers: [LostDealsService],
  controllers: [LostDealsController],
})
export class CrmModule {}

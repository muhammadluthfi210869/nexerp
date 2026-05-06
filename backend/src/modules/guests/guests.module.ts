import { Module } from '@nestjs/common';
import { GuestsService } from './guests/guests.service';
import { GuestsController } from './guests/guests.controller';

@Module({
  providers: [GuestsService],
  controllers: [GuestsController],
})
export class GuestsModule {}

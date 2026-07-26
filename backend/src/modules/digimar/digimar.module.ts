import { Module } from '@nestjs/common';
import { DigimarController } from './digimar.controller';
import { DigimarService } from './digimar.service';
import { DigimarGateway } from './digimar.gateway';

@Module({
  controllers: [DigimarController],
  providers: [DigimarService, DigimarGateway],
  exports: [DigimarService],
})
export class DigimarModule {}

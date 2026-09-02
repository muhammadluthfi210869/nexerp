import { Global, Module } from '@nestjs/common';
import { StateTransitionService } from './state-transition.service';
import { CommunicationProtocolService } from './communication-protocol/communication-protocol.service';
import { WarehouseModule } from '../warehouse/warehouse.module';

import { SystemController } from './system.controller';
import { IdGeneratorService } from './id-generator.service';

@Global()
@Module({
  imports: [WarehouseModule],
  providers: [
    StateTransitionService,
    CommunicationProtocolService,
    IdGeneratorService,
  ],
  controllers: [SystemController],
  exports: [
    StateTransitionService,
    CommunicationProtocolService,
    IdGeneratorService,
  ],
})
export class SystemModule {}

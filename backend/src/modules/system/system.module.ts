import { Global, Module } from '@nestjs/common';
import { StateTransitionService } from './state-transition.service';
import { CommunicationProtocolService } from './communication-protocol/communication-protocol.service';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ErrorAggregationService } from './services/error-aggregation.service';

import { SystemController } from './system.controller';
import { IdGeneratorService } from './id-generator.service';

@Global()
@Module({
  imports: [WarehouseModule, PrismaModule],
  providers: [
    StateTransitionService,
    CommunicationProtocolService,
    IdGeneratorService,
    ErrorAggregationService,
  ],
  controllers: [SystemController],
  exports: [
    StateTransitionService,
    CommunicationProtocolService,
    IdGeneratorService,
    ErrorAggregationService,
  ],
})
export class SystemModule {}

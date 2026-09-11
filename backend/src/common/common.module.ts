import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceGateHelper } from './helpers/gate.helper';

/**
 * CommonModule exports shared infrastructure helpers used across all feature modules.
 * Marked @Global so providers are available everywhere without re-import.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [FinanceGateHelper],
  exports: [FinanceGateHelper],
})
export class CommonModule {}

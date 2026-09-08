import { Module } from '@nestjs/common';
import { ClientEscrowsService } from './client-escrows.service';
import { ClientEscrowsController } from './client-escrows.controller';

@Module({
  controllers: [ClientEscrowsController],
  providers: [ClientEscrowsService],
  exports: [ClientEscrowsService],
})
export class ClientEscrowsModule {}

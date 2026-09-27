import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CollectorService } from './collector.service';
import { StorageService } from './storage.service';
import { CoverageService } from './coverage.service';
import { WaSelfQrController } from './wa-self-qr.controller';
import { SalesDeviceManager } from './sales-device-manager';
import { ConnectPageController } from './connect-page.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WaSelfQrController, ConnectPageController],
  providers: [CollectorService, StorageService, CoverageService, SalesDeviceManager],
  exports: [CollectorService, StorageService, CoverageService, SalesDeviceManager],
})
export class WaSelfQrModule {}

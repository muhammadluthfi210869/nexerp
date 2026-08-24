import { Module } from '@nestjs/common';
import { LeadCaptureController } from './lead-capture.controller';
import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';
import { KommoAutoSyncService } from './kommo-auto-sync.service';
import { LeadValidationService } from './lead-validation.service';
import { LeadValidationListener } from './lead-validation.listener';
import { QrController } from './qr/qr.controller';
import { QrService } from './qr/qr.service';
import { LeadEventsGateway } from './realtime/lead-events.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-only-not-secure',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [LeadCaptureController, QrController],
  providers: [
    LeadCaptureService,
    KommoService,
    KommoAutoSyncService,
    LeadValidationService,
    LeadValidationListener,
    QrService,
    LeadEventsGateway,
  ],
  exports: [
    LeadCaptureService,
    KommoService,
    LeadValidationService,
    QrService,
  ],
})
export class LeadCaptureModule {}
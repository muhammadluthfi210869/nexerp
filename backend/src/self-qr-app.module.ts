import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WaSelfQrModule } from './modules/wa-self-qr/wa-self-qr.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    WaSelfQrModule,
  ],
})
export class SelfQrAppModule {}

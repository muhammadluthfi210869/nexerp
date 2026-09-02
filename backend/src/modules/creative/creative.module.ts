import { Module } from '@nestjs/common';
import { CreativeService } from './creative.service';
import { CreativeController } from './creative.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BussdevModule } from '../bussdev/bussdev.module';

@Module({
  imports: [PrismaModule, BussdevModule],
  controllers: [CreativeController],
  providers: [CreativeService],
  exports: [CreativeService],
})
export class CreativeModule {}

import { Module, forwardRef } from '@nestjs/common';
import { BussdevService } from './bussdev.service';
import { BussdevController } from './bussdev.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BussdevListener } from './bussdev.listener';

import { ScmModule } from '../scm/scm.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ScmModule)],
  controllers: [BussdevController],
  providers: [BussdevService, BussdevListener],
  exports: [BussdevService],
})
export class BussdevModule {}

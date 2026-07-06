import { Module } from '@nestjs/common';
import { NpfController } from './npf/npf.controller';
import { SamplesController } from './samples/samples.controller';
import { FormulasService } from './formulas/formulas.service';
import { FormulasController } from './formulas/formulas.controller';
import { RndService } from './rnd.service';
import { RndController } from './rnd.controller';
import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [LegalityModule],
  providers: [FormulasService, RndService],
  controllers: [
    NpfController,
    SamplesController,
    FormulasController,
    RndController,
  ],
  exports: [RndService],
})
export class RndModule {}

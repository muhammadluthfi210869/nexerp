import { Module } from '@nestjs/common';
import { NpfService } from './npf/npf.service';
import { NpfController } from './npf/npf.controller';
import { SamplesService } from './samples/samples.service';
import { SamplesController } from './samples/samples.controller';
import { FormulasService } from './formulas/formulas.service';
import { FormulasController } from './formulas/formulas.controller';
import { RndService } from './rnd.service';
import { RndController } from './rnd.controller';
import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [LegalityModule],
  providers: [NpfService, SamplesService, FormulasService, RndService],
  controllers: [
    NpfController,
    SamplesController,
    FormulasController,
    RndController,
  ],
  exports: [RndService],
})
export class RndModule {}

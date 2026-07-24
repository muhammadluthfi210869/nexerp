import { Module } from '@nestjs/common';
import { NpfController } from './npf/npf.controller';
import { SamplesController } from './samples/samples.controller';
import { FormulasService } from './formulas/formulas.service';
import { FormulasController } from './formulas/formulas.controller';
import { RndService } from './rnd.service';
import { RndController } from './rnd.controller';

// ⚠️ PRODUCTION-LIGHT: LegalityModule dihapus dari imports
// karena FormulasService sudah tidak menggunakan LegalityService.
// Lihat PRODUCTION_LIGHT.md untuk detail.

@Module({
  imports: [],
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

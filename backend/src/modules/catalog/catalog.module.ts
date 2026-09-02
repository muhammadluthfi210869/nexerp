import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';

/**
 * Catalog module — generic CRUD for any Prisma model not already covered
 * by a dedicated module (marketing, rnd, etc.).
 *
 * Tujuan: kil.nexerp.id preview frontend punya backend endpoint untuk
 * Finance/HR/SCm/QC/Warehouse/Production/Legal/Executive/Bussdev/System
 * tanpa harus rebuild module dedicated. Read-only untuk model sensitif,
 * write blacklist enforced.
 */
@Module({
  controllers: [CatalogController],
})
export class CatalogModule {}

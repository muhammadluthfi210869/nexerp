/**
 * One-shot test DB cleanup. SAFETY guard refuses to run unless pointed at erp_db_test.
 */
import { describe, it, beforeAll } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';

const REQUIRED_DB_NAME = 'erp_db_test';
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

if (!process.env.DATABASE_URL?.includes(REQUIRED_DB_NAME)) {
  throw new Error('SAFETY: refuse to clean non-test DB');
}

import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { Test } from '@nestjs/testing';

describe('Cleanup erp_db_test', () => {
  it('cleans all test rows', async () => {
    const mod = await Test.createTestingModule({ imports: [PrismaModule] }).compile();
    const p = mod.get(PrismaService);
    // Order matters — delete children before parents.
    await p.salesOrderAmendment.deleteMany({});
    await p.salesOrderItem.deleteMany({});
    await p.salesOrder.deleteMany({});
    await p.regulatoryPipeline.deleteMany({});
    await p.formulaItem.deleteMany({});
    await p.formulaPhase.deleteMany({});
    await p.qCParameter.deleteMany({});
    await p.formula.deleteMany({});
    await p.sampleStageLog.deleteMany({});
    await p.sampleRequest.deleteMany({});
    await p.newProductForm.deleteMany({});
    await p.salesLead.deleteMany({});
    await p.bussdevStaff.deleteMany({});
    await p.$disconnect();
  }, 30000);
});

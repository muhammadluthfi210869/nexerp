import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { CrmProjectionService } from '../src/modules/crm/common/crm-projection.service';
import { DreamlabRrSyncService } from '../src/modules/marketing/omni-crm/dreamlab-rr-sync.service';

async function main() {
  const apply = process.argv.includes('--apply');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const projection = app.get(CrmProjectionService);
  const dreamlab = app.get(DreamlabRrSyncService);

  try {
    const [captureCount, projectedCount] = await Promise.all([
      prisma.leadCapture.count(),
      prisma.crmLead.count(),
    ]);
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', captureCount, projectedCount }));
    if (!apply) {
      console.log('Dry-run only. Re-run with --apply to project all LeadCapture rows and reconcile Dreamlab.');
      return;
    }

    const batchSize = 100;
    let cursor: string | undefined;
    let processed = 0;
    for (;;) {
      const rows = await prisma.leadCapture.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
        take: batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (rows.length === 0) break;
      for (let index = 0; index < rows.length; index += 10) {
        await Promise.all(rows.slice(index, index + 10).map((row) => projection.syncLeadCapture(row.id)));
      }
      processed += rows.length;
      cursor = rows[rows.length - 1]?.id;
      console.log(`Projected ${processed}/${captureCount}`);
    }

    const dreamlabResult = process.env.DREAMLAB_DATABASE_URL
      ? await dreamlab.syncDreamlabRoundRobin()
      : { success: false, skipped: true, reason: 'DREAMLAB_DATABASE_URL is not configured' };
    const finalProjectedCount = await prisma.crmLead.count();
    console.log(JSON.stringify({ processed, finalProjectedCount, dreamlabResult }));
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

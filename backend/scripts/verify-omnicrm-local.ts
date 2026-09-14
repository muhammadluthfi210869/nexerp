import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { LeadsService } from '../src/modules/crm/leads/leads.service';
import { KpiService } from '../src/modules/crm/kpi/kpi.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);
    const leads = app.get(LeadsService);
    const kpi = app.get(KpiService);
    const filter = { from: '2026-09-01', to: '2026-09-30', limit: 100, offset: 0 };
    const [agents, live, summary] = await Promise.all([
      prisma.roundRobinAgent.findMany({ where: { isActive: true }, select: { id: true } }),
      leads.listWithGuestbook(filter),
      kpi.summary(filter),
    ]);
    console.log(JSON.stringify({
      ok: true,
      activeAgents: agents.length,
      liveLeadRows: live.items.length,
      liveLeadTotal: live.total,
      kpiLeadsToday: summary.leadsToday,
      kpiLeadsThisWeek: summary.leadsThisWeek,
    }));
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

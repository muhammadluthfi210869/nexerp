import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BussdevService } from '../src/modules/bussdev/bussdev.service';
import { PipelineStage } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma/prisma.service';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BussdevService);
  const prisma = app.get(PrismaService);

  console.log('--- Verification Start ---');

  // 1. Create a Lead
  const bdStaff = await prisma.bussdevStaff.findFirst() || await prisma.bussdevStaff.create({ data: { name: 'Test Staff', targetRevenue: 100 } });
  
  const lead = await (service as any).createLead({
    clientName: 'Test Event Client',
    productInterest: 'Serum',
    contactInfo: '081',
    source: 'Google',
    estimatedValue: 1000000,
    picId: bdStaff.id,
  });
  console.log('Lead Created:', lead.id);

  // 2. Advance Stage to SAMPLE_PROCESS (Should trigger SLA of 2 hours)
  console.log('Advancing stage to SAMPLE_PROCESS...');
  await (service as any).advanceLeadStage(lead.id, {
    newStage: PipelineStage.SAMPLE_PROCESS,
    action: 'MOVE_TO_SAMPLE',
    loggedBy: 'FINA_TEST'
  });

  // 3. Wait a bit for the async listener to finish
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Check ActivityStream
  const logs = await prisma.activityStream.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n--- Activity Stream Logs ---');
  logs.forEach(log => {
    console.log(`[${log.senderDivision}] ${log.eventType}: ${log.notes}`);
    if (log.deadlineAt) {
      console.log(`   SLA Deadline: ${log.deadlineAt.toISOString()}`);
    }
  });

  await app.close();
}

verify().catch(console.error);

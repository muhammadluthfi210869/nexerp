
import { PrismaClient, LifecycleStatus, ProdStage, QCStatus, MachineType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt, randomDecimal, randomAprilDate } from './utils';

export async function seedProduction(prisma: PrismaClient) {
  console.log('🌱 Seeding Production Data...');

  const leads = await prisma.salesLead.findMany({
    where: { status: { in: ['PRODUCTION_PLAN', 'WON_DEAL'] } }
  });
  const users = await prisma.user.findMany();
  const prodAdmin = users.find(u => u.roles.includes('PRODUCTION')) || users[0];

  // 1. Machines
  const machineTypes = Object.values(MachineType);
  for (const type of machineTypes) {
    await prisma.machine.create({
      data: {
        name: `${type.replace('_', ' ')} ${faker.string.numeric(2)}`,
        type,
        capacityPerBatch: randomDecimal(100, 1000),
        isActive: true,
      }
    });
  }
  const machines = await prisma.machine.findMany();

  for (const lead of leads) {
    const wo = await prisma.workOrder.create({
      data: {
        leadId: lead.id,
        woNumber: `WO-${faker.string.alphanumeric(6).toUpperCase()}`,
        targetQty: randomInt(1000, 10000),
        stage: randomElement(Object.values(LifecycleStatus)),
        targetCompletion: faker.date.future(),
        targetHpp: randomDecimal(5000, 15000),
      }
    });

    // Create a Production Plan for some WOs
    if (wo.stage !== 'WAITING_MATERIAL') {
      const so = await prisma.salesOrder.findFirst({ where: { leadId: lead.id } });
      
      if (so) {
        const plan = await prisma.productionPlan.create({
          data: {
            soId: so.id,
            adminId: prodAdmin.id,
            batchNo: `BATCH-${faker.string.alphanumeric(8).toUpperCase()}`,
            status: wo.stage,
          }
        });
        
        await prisma.workOrder.update({
          where: { id: wo.id },
          data: { planId: plan.id }
        });

        // Add Logs
        const logCount = randomInt(1, 3);
        for (let l = 0; l < logCount; l++) {
          await prisma.productionLog.create({
            data: {
              workOrderId: wo.id,
              planId: plan.id,
              stage: wo.stage,
              inputQty: wo.targetQty,
              goodQty: wo.targetQty * 0.98,
              quarantineQty: 0,
              rejectQty: wo.targetQty * 0.02,
              machineId: randomElement(machines).id,
              operatorId: prodAdmin.id,
              startTime: randomAprilDate(),
              endTime: randomAprilDate(),
            }
          });
        }
      }
    }
  }

  console.log('✅ Production Data Seeded.');
}

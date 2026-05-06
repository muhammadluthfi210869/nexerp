
import { PrismaClient, DesignState, ApprovalStatus, Division } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt } from './utils';

export async function seedCreative(prisma: PrismaClient) {
  console.log('🌱 Seeding Creative Data...');

  const leads = await prisma.salesLead.findMany({ take: 30 });
  const users = await prisma.user.findMany();
  
  for (const lead of leads) {
    const task = await prisma.designTask.create({
      data: {
        leadId: lead.id,
        brief: faker.lorem.paragraph(),
        kanbanState: randomElement(Object.values(DesignState)),
        slaDeadline: faker.date.future(),
      }
    });

    // Versions
    const versionCount = randomInt(1, 3);
    for (let v = 1; v <= versionCount; v++) {
      await prisma.designVersion.create({
        data: {
          taskId: task.id,
          versionNumber: v,
          artworkUrl: faker.image.url(),
          mockupUrl: faker.image.url(),
          printSpecs: { finish: 'Glossy', paper: 'Art Paper 150gr' },
        }
      });
    }

    // Feedback
    if (task.kanbanState !== 'INBOX') {
      await prisma.designFeedback.create({
        data: {
          taskId: task.id,
          fromDivision: Division.BD,
          authorId: randomElement(users).id,
          content: faker.lorem.sentence(),
          approvalStatus: randomElement(Object.values(ApprovalStatus)),
        }
      });
    }
  }

  console.log('✅ Creative Data Seeded.');
}

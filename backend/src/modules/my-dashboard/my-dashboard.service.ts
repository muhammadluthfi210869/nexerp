import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class MyDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersonalStats(userId: string) {
    const [leadsCount, dealsCount, activitiesCount, pendingAudits, assignedWOs] = await Promise.all([
      this.prisma.salesLead.count({ where: { bdId: userId } }),
      this.prisma.salesLead.count({ where: { bdId: userId, status: 'WON_DEAL' } }),
      this.prisma.activityStream.count({ where: { lead: { bdId: userId } } }),
      this.prisma.qCAudit.count({ where: { qcId: userId, status: { not: 'GOOD' } } }),
      this.prisma.workOrder.count({ where: { lead: { bdId: userId } } }),
    ]);

    return {
      userId,
      cards: {
        leads: { value: leadsCount, target: 30 },
        deals: { value: dealsCount, target: 10 },
        tasks: { pending: 0, overdue: 0 },
      },
      activities: [],
      recentActivity: activitiesCount,
      pendingAudits,
      activeWorkOrders: assignedWOs,
    };
  }
}

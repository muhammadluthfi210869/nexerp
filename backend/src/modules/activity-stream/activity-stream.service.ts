import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ActivityLoggedEvent } from './events/activity.events';

@Injectable()
export class ActivityStreamService {
  constructor(private prisma: PrismaService) {}

  async createLog(event: ActivityLoggedEvent) {
    const deadlineAt = event.expectedDuration
      ? new Date(Date.now() + event.expectedDuration * 60 * 1000)
      : null;

    return this.prisma.activityStream.create({
      data: {
        leadId: event.leadId,
        senderDivision: event.senderDivision,
        eventType: event.eventType,
        notes: event.notes,
        payload: event.payload,
        loggedBy: event.loggedBy,
        expectedDuration: event.expectedDuration,
        deadlineAt: deadlineAt,
      },
      include: {
        lead: {
          select: { clientName: true, brandName: true },
        },
      },
    });
  }

  async getLogsByLead(leadId: string) {
    return this.prisma.activityStream.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

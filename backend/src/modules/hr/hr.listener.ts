import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class HrListener implements OnModuleInit {
  constructor(
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Use onAny to capture ALL events including the event name
    this.eventEmitter.onAny((event: string | string[], payload: any) => {
      const eventName = Array.isArray(event) ? event.join('.') : event;
      this.handleEvent(eventName, payload);
    });
  }

  private async handleEvent(eventName: string, payload: any) {
    try {
      // 1. Check if this event is a defined KPI metric
      const metric = await this.prisma.kpiMetricDefinition.findUnique({
        where: { eventCode: eventName },
      });

      if (!metric || !metric.isActive) return;

      // 2. Identify the target employee (must be in payload)
      const employeeId = payload?.employeeId || payload?.userId;
      if (!employeeId) return;

      // 3. Log the points (Passive Harvesting)
      await this.prisma.kpiPointLog.create({
        data: {
          employeeId,
          metricCode: eventName,
          points: metric.points,
          metadata: {
            ...(payload?.metadata || {}),
            referenceId: payload?.referenceId || payload?.id,
          },
        },
      });

      console.log(
        `[HR-HARVEST] Captured ${eventName} for ${employeeId}: ${metric.points} points`,
      );
    } catch (error) {
      console.error(
        `[HR-HARVEST-ERROR] Failed to process ${eventName}:`,
        error,
      );
    }
  }
}

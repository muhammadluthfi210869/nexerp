import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityStreamService } from './activity-stream.service';
import { ActivityStreamGateway } from './activity-stream.gateway';
import { ACTIVITY_EVENT, ActivityLoggedEvent } from './events/activity.events';

@Injectable()
export class ActivityStreamListener {
  private readonly logger = new Logger(ActivityStreamListener.name);

  constructor(
    private readonly service: ActivityStreamService,
    private readonly gateway: ActivityStreamGateway,
  ) {}

  @OnEvent(ACTIVITY_EVENT)
  async handleActivityLoggedEvent(event: ActivityLoggedEvent) {
    this.logger.log(`Received activity event for lead: ${event.leadId}`);

    try {
      // 1. Persist to Database
      const log = await this.service.createLog(event);

      // 2. Push to WebSockets (Real-time HUD)
      this.gateway.broadcastLog(log);

      this.logger.log(
        `Activity logged and broadcasted for lead: ${event.leadId}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to process activity event: ${error.message}`);
    }
  }
}

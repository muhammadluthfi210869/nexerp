import { Division, StreamEventType } from '@prisma/client';

export const ACTIVITY_EVENT = 'activity.logged';

export interface ActivityLoggedEvent {
  leadId: string;
  senderDivision: Division;
  eventType: StreamEventType;
  notes?: string;
  payload?: any;
  loggedBy?: string;
  expectedDuration?: number; // in minutes
}

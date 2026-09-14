import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type CrmEventType =
  | 'crm.lead.created'
  | 'crm.lead.updated'
  | 'crm.guestbook.updated'
  | 'crm.kpi.invalidated';

export interface CrmEvent {
  type: CrmEventType;
  leadId?: string;
  emittedAt: string;
}

@Injectable()
export class CrmEventsService {
  private readonly events = new Subject<CrmEvent>();

  emit(type: CrmEventType, leadId?: string): void {
    this.events.next({ type, leadId, emittedAt: new Date().toISOString() });
  }

  stream(): Observable<CrmEvent> {
    return this.events.asObservable();
  }
}

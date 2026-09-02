import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Controller('events')
export class EventsController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Sse('busdev')
  sseBusDev(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'production.update').pipe(
      map(
        (payload: any) =>
          ({
            data: payload,
            type: 'production_update',
          }) as MessageEvent,
      ),
    );
  }

  @Sse('qc')
  sseQC(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'qc.notification').pipe(
      map(
        (payload: any) =>
          ({
            data: payload,
            type: 'qc_notification',
          }) as MessageEvent,
      ),
    );
  }

  @Sse('maintenance')
  sseMaintenance(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'machine.error').pipe(
      map(
        (payload: any) =>
          ({
            data: payload,
            type: 'machine_error',
          }) as MessageEvent,
      ),
    );
  }
  @Sse('creative')
  sseCreative(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'creative.update').pipe(
      map(
        (payload: any) =>
          ({
            data: payload,
            type: 'creative_update',
          }) as MessageEvent,
      ),
    );
  }
}

import { Controller, Header, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CrmEventsService } from '../common/crm-events.service';

@ApiTags('crm')
@ApiBearerAuth()
@Controller(['crm', 'v1/crm'])
@UseGuards(JwtAuthGuard)
export class CrmEventsController {
  constructor(private readonly events: CrmEventsService) {}

  @Sse('events')
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache, no-transform')
  stream(): Observable<MessageEvent> {
    return this.events.stream().pipe(
      map((event) => ({ type: event.type, data: event })),
    );
  }
}

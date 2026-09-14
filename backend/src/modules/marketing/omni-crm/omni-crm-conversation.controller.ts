import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { OmniCrmConversationService } from './omni-crm-conversation.service';
import { DreamlabRrSyncService } from './dreamlab-rr-sync.service';
import { SendOutboundMessageDto } from './dto/send-outbound-message.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['v1/marketing/omni-crm/conversations', 'marketing/omni-crm/conversations'])
export class OmniCrmConversationController {
  constructor(
    private readonly service: OmniCrmConversationService,
    private readonly rrSyncService: DreamlabRrSyncService,
  ) {}

  /**
   * GET /v1/marketing/omni-crm/conversations
   * List leads with WA phone + last message preview (sidebar).
   */
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  list(@Query('limit') limit?: string, @Query('assignedTo') assignedTo?: string) {
    return this.service.listConversations(
      limit ? Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500) : 100,
      assignedTo,
    );
  }

  /**
   * GET /v1/marketing/omni-crm/conversations/busdevs
   * List real BusDev sales representatives.
   */
  @Get('busdevs')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  busdevs() {
    return this.service.listBusDevs();
  }

  @Get('gateway-status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  gatewayStatus() {
    return this.service.getGatewayStatus();
  }

  /**
   * GET /v1/marketing/omni-crm/conversations/dreamlab-rr-summary
   * Statistik live round robin dari website database.
   */
  @Get('dreamlab-rr-summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  getDreamlabRrSummary() {
    return this.rrSyncService.getDreamlabRoundRobinSummary();
  }

  /**
   * POST /v1/marketing/omni-crm/conversations/sync-dreamlab-rr
   * Tarik data 353 leads & update BusDev distribution dari website ke ERP.
   */
  @Post('sync-dreamlab-rr')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  syncDreamlabRr() {
    return this.rrSyncService.syncDreamlabRoundRobin();
  }

  /**
   * GET /v1/marketing/omni-crm/conversations/:leadId/messages
   * Full chat thread for one lead, oldest → newest.
   */
  @Get(':leadId/messages')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  messages(@Param('leadId') leadId: string) {
    return this.service.getMessages(leadId);
  }

  /**
   * POST /v1/marketing/omni-crm/conversations/send
   * Body: { leadId?, phone, message, phoneNumberId? }
   * Sends via Meta Cloud API and persists OUTBOUND row.
   */
  @Post('send')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  send(@Body() body: SendOutboundMessageDto) {
    return this.service.sendOutbound(body);
  }
}

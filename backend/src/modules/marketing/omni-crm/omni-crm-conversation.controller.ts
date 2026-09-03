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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/marketing/omni-crm/conversations')
export class OmniCrmConversationController {
  constructor(private readonly service: OmniCrmConversationService) {}

  /**
   * GET /v1/marketing/omni-crm/conversations
   * List leads with WA phone + last message preview (sidebar).
   */
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  list(@Query('limit') limit?: string, @Query('assignedTo') assignedTo?: string) {
    return this.service.listConversations(
      limit ? Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200) : 50,
      assignedTo,
    );
  }

  /**
   * GET /v1/marketing/omni-crm/conversations/:leadId/messages
   * Full chat thread for one lead, oldest → newest.
   */
  @Get(':leadId/messages')
  @Roles(
    UserRole.SUPER_ADMIN,
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
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  send(
    @Body()
    body: {
      leadId?: string;
      phone: string;
      message: string;
      phoneNumberId?: string;
    },
  ) {
    return this.service.sendOutbound(body);
  }
}

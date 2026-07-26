import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeadCaptureService } from './lead-capture.service';
import { LeadStatus, WorkflowStatus } from '@prisma/client';

// ── DTO (inline for simplicity) ──

class TrackDto {
  intent?: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  sessionId?: string;
}

class WhatsAppUpdateDto {
  phone!: string;
  waName?: string;
  waMessage?: string;
}

class UpdateLeadDto {
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: LeadStatus;
  workflowStatus?: WorkflowStatus;
  assignedTo?: string;
  lostReason?: string;
}

class BulkUpdateDto {
  ids!: string[];
  status?: LeadStatus;
  workflowStatus?: WorkflowStatus;
  assignedTo?: string;
}

class ListQueryDto {
  status?: LeadStatus;
  workflowStatus?: WorkflowStatus;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Controller ──

@Controller('lead-capture')
export class LeadCaptureController {
  constructor(private readonly service: LeadCaptureService) {}

  // ════════════════════════════════════════════
  //  PUBLIC ENDPOINTS (no auth required)
  //  Used by dreamlab.id website widgets
  // ════════════════════════════════════════════

  @Post('track')
  @HttpCode(HttpStatus.OK)
  async track(@Body() dto: TrackDto) {
    return this.service.track(dto);
  }

  @Put('whatsapp/:trackingCode')
  @HttpCode(HttpStatus.OK)
  async updateFromWhatsApp(
    @Param('trackingCode') trackingCode: string,
    @Body() dto: WhatsAppUpdateDto,
  ) {
    return this.service.updateFromWhatsApp(trackingCode, dto);
  }

  // ════════════════════════════════════════════
  //  AUTHENTICATED ENDPOINTS (admin dashboard)
  // ════════════════════════════════════════════

  @Get()
  async list(@Query() query: ListQueryDto) {
    return this.service.listLeads(query);
  }

  @Get('stats')
  async stats() {
    return this.service.getStats();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getLead(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.updateLead(id, dto);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    return this.service.bulkUpdate(dto.ids, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.deleteLead(id);
  }

  // ════════════════════════════════════════════════
  //  ROUND ROBIN ENDPOINTS
  // ════════════════════════════════════════════════

  @Get('round-robin/next')
  async getNextAgent() {
    return this.service.getNextRoundRobinAgent();
  }

  @Get('round-robin/status')
  async getRoundRobinStatus() {
    return this.service.getRoundRobinStatus();
  }

  @Post('round-robin/agents')
  async upsertAgent(@Body() dto: {
    id?: string;
    name: string;
    phoneNumber: string;
    orderIndex: number;
    isActive?: boolean;
  }) {
    return this.service.upsertRoundRobinAgent(dto);
  }

  @Delete('round-robin/agents/:id')
  async deleteAgent(@Param('id') id: string) {
    return this.service.deleteRoundRobinAgent(id);
  }
}

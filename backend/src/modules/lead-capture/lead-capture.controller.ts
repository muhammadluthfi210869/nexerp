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
  UseGuards,
} from '@nestjs/common';
import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';
import { LeadStatus, WorkflowStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

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

@UseGuards(JwtAuthGuard)
@Controller('lead-capture')
export class LeadCaptureController {
  constructor(
    private readonly service: LeadCaptureService,
    private readonly kommo: KommoService,
  ) {}

  // ════════════════════════════════════════════
  //  PUBLIC ENDPOINTS (no auth required)
  //  Used by dreamlab.id website widgets
  // ════════════════════════════════════════════

  @Public()
  @Post('track')
  @HttpCode(HttpStatus.OK)
  async track(@Body() dto: TrackDto) {
    return this.service.track(dto);
  }

  @Public()
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
  //  KOMMO WEBHOOK & SYNC
  // ════════════════════════════════════════════════

  @Post('kommo-webhook')
  @HttpCode(HttpStatus.OK)
  async kommoWebhook(@Body() body: any) {
    const result = await this.kommo.processWebhook(body);

    // Process each contact: find lead by phone, update name
    let updated = 0;
    const added = body?.contacts?.add ?? [];
    const updatedContacts = body?.contacts?.update ?? [];
    const allContacts = [...added, ...updatedContacts];

    for (const contact of allContacts) {
      const name = contact.name;
      if (!name) continue;

      const phones = this.kommo.extractPhones(contact);
      for (const phone of phones) {
        const lead = await this.service.updateLeadFromKommo(phone, name);
        if (lead) updated++;
      }
    }

    return { received: result.processed, updated };
  }

  @Post('kommo-sync')
  @HttpCode(HttpStatus.OK)
  async kommoSync() {
    // Cari semua lead yang punya nomor HP tapi belum ada nama
    const leadsWithoutName = await this.service.findLeadsWithoutName();
    let updated = 0;

    for (const lead of leadsWithoutName) {
      if (!lead.phone) continue;
      const contact = await this.kommo.findContactByPhone(lead.phone);
      if (contact) {
        await this.service.updateLeadFromKommo(contact.phone, contact.name);
        updated++;
      }
    }

    return { scanned: leadsWithoutName.length, updated };
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

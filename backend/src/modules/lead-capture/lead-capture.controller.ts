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
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';
import { LeadStatus, WorkflowStatus } from '@prisma/client';
import { IsOptional, IsString, IsDateString } from 'class-validator';

// ── DTO (inline for simplicity) ──

class TrackDto {
  @IsOptional() @IsString() intent?: string;
  @IsOptional() @IsString() pageUrl?: string;
  @IsOptional() @IsString() pageTitle?: string;
  @IsOptional() @IsString() referrer?: string;
  @IsOptional() @IsString() utmSource?: string;
  @IsOptional() @IsString() utmMedium?: string;
  @IsOptional() @IsString() utmCampaign?: string;
  @IsOptional() @IsString() utmContent?: string;
  @IsOptional() @IsString() utmTerm?: string;
  @IsOptional() @IsString() deviceType?: string;
  @IsOptional() @IsString() browser?: string;
  @IsOptional() @IsString() ipAddress?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsString() assignedName?: string;   // Round-robin agent name
  @IsOptional() @IsString() assignedPhone?: string;  // Round-robin agent phone number
}

class WhatsAppUpdateDto {
  @IsString() phone!: string;
  @IsOptional() @IsString() waName?: string;
  @IsOptional() @IsString() waMessage?: string;
  @IsOptional() @IsString() msgId?: string;
}

/**
 * POST /lead-capture/website-bridge/track
 *
 * Server-authoritative handoff from the dreamlab.id website (Vercel).
 * The website runs its own round-robin against its VPS (4 Sales),
 * then forwards the assignment here with the customer-facing tracking
 * code. This endpoint persists the journey:
 *
 *   sourcePage → thankYouPage → assigned Sales → waDestinationPhone
 *
 * Trust boundary: caller MUST present `x-dreamlab-bridge-secret`
 * matching `ERP_BRIDGE_SECRET` env. No public anonymous writes.
 *
 * Idempotency: `websiteIntentId` is the canonical tracking code the
 * website shows in the WhatsApp message (e.g. "DL1A2B3C4D5"). Re-POST
 * with the same id returns the existing lead (no duplicates) and
 * preserves the assigned Sales.
 *
 * Phone policy: `assignedPhone` (Sales WhatsApp number) is the
 * destination we redirect the customer to. `whatsappPhone` (customer
 * phone) is NEVER set here — it stays NULL until Self QR matches an
 * inbound WhatsApp chat to [Kode: <websiteIntentId>].
 */
class BridgeTrackDto {
  @IsString() websiteIntentId!: string;
  @IsOptional() @IsString() assignedSalesId?: string;
  @IsOptional() @IsString() assignedName?: string;
  @IsOptional() @IsString() assignedPhone?: string;
  @IsOptional() @IsString() pageUrl?: string;            // thank-you page URL
  @IsOptional() @IsString() sourcePage?: string;         // original source page URL
  @IsOptional() @IsString() ctaType?: string;
  @IsOptional() @IsDateString() ctaClickedAt?: string;
  @IsOptional() @IsDateString() thankYouViewedAt?: string;
  @IsOptional() @IsString() intent?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() referrer?: string;
  @IsOptional() @IsString() utmSource?: string;
  @IsOptional() @IsString() utmMedium?: string;
  @IsOptional() @IsString() utmCampaign?: string;
  @IsOptional() @IsString() utmContent?: string;
  @IsOptional() @IsString() utmTerm?: string;
  @IsOptional() @IsString() deviceType?: string;
  @IsOptional() @IsString() browser?: string;
  @IsOptional() @IsString() ipAddress?: string;
  @IsOptional() @IsString() sessionId?: string;
}

class UpdateLeadDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() status?: LeadStatus;
  @IsOptional() workflowStatus?: WorkflowStatus;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() lostReason?: string;
  @IsOptional() @IsString() aiStatus?: string;
}

class UpdateAttributeDto {
  @IsOptional() confirmed?: boolean;
  @IsOptional() @IsString() value?: string;
}

class BulkUpdateDto {
  @IsString({ each: true }) ids!: string[];
  @IsOptional() status?: LeadStatus;
  @IsOptional() workflowStatus?: WorkflowStatus;
  @IsOptional() @IsString() assignedTo?: string;
}

class ListQueryDto {
  @IsOptional() status?: LeadStatus;
  @IsOptional() workflowStatus?: WorkflowStatus;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() sortOrder?: 'asc' | 'desc';
}

// ── Controller ──

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

  @Post('track')
  @HttpCode(HttpStatus.OK)
  async track(@Body() dto: TrackDto) {
    return this.service.track(dto);
  }

  /**
   * Website → ERP bridge (idempotent).
   * See BridgeTrackDto above for the data contract.
   */
  @Post('website-bridge/track')
  @HttpCode(HttpStatus.OK)
  async bridgeTrack(
    @Headers('x-dreamlab-bridge-secret') secret: string | undefined,
    @Body() dto: BridgeTrackDto,
  ) {
    const expected = process.env.ERP_BRIDGE_SECRET;
    if (!expected || expected.length === 0) {
      throw new BadRequestException('ERP_BRIDGE_SECRET not configured on server');
    }
    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Invalid bridge secret');
    }
    if (!dto?.websiteIntentId || typeof dto.websiteIntentId !== 'string') {
      throw new BadRequestException('websiteIntentId is required');
    }
    return this.service.bridgeTrack(dto);
  }

  /**
   * Fire-and-forget click tracking from the website thank-you page.
   * Records the moment the user actually clicked the WhatsApp button
   * (distinct from the bridge call which only records view → assignment).
   * Self QR will later bind this journey to the inbound chat.
   */
  @Post('whatsapp-click/:trackingCode')
  @HttpCode(HttpStatus.OK)
  async recordWhatsAppClick(@Param('trackingCode') trackingCode: string) {
    return this.service.recordWhatsAppClick(trackingCode);
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

  /**
   * Minimal read model for the Self QR → LeadCapture validation pipeline.
   * Returns the exact columns the tracking code needs to render a row:
   * trackingCode, name (fullName), product (first LeadAttribute), customer
   * WhatsApp phone, source page, thank-you page, CTA, assigned Sales,
   * whatsappClickedAt, whatsappVerifiedAt, verificationStatus.
   *
   * Intentionally no charts / KPI / analytics — just the validated lead
   * list. Backed by an index on verificationStatus + assignedSalesId.
   */
  @Get('tracked')
  async tracked(@Query() query: { verificationStatus?: string; limit?: string }) {
    return this.service.listTrackedLeads({
      verificationStatus: query.verificationStatus,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Get('stats')
  async stats() {
    return this.service.getStats();
  }

  @Get('dashboard')
  async dashboard(@Query() query: { dateFrom?: string; dateTo?: string }) {
    return this.service.getDashboardAnalytics(query);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.updateLead(id, dto);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    return this.service.bulkUpdate(dto.ids, dto);
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

  @Get('kommo-status')
  async kommoStatus() {
    return this.kommo.getAccountStatus();
  }

  @Post('kommo-pull')
  @HttpCode(HttpStatus.OK)
  async kommoPull(@Body() body?: { dateFrom?: string; dateTo?: string }) {
    try {
      const result = await this.kommo.pullAllLeads(body?.dateFrom, body?.dateTo);
      // Save pulled leads to database
      const saved = await this.service.saveKommoLeads(result.leads, result.contacts, result);
      return { pulled: result.leads.length, saved };
    } catch (err: any) {
      return {
        error: err.message || 'Failed to pull from Kommo',
        details: 'Pastikan KOMMO_API_TOKEN adalah access token aktif untuk subdomain Kommo yang benar'
      };
    }
  }

  @Post('import-csv')
  @HttpCode(HttpStatus.OK)
  async importCsv(@Body() body: { leads: any[] }) {
    if (!body.leads || !Array.isArray(body.leads)) {
      return { error: 'Format: { leads: [...] }' };
    }
    const saved = await this.service.bulkImportLeads(body.leads);
    return { imported: saved };
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

  // Fase 3.1 — jalankan AI extraction manual untuk satu lead
  @Post(':id/ai-extract')
  @HttpCode(HttpStatus.OK)
  async aiExtract(@Param('id') id: string) {
    const result = await this.service.extractAiForLead(id);
    if (!result) {
      return { status: 'no_result', message: 'Tidak ada pesan atau ekstraksi gagal' };
    }
    return { status: 'suggested', suggestion: result };
  }

  // Fase 3.3 — terapkan saran pipeline stage (workflowStatus)
  @Post(':id/ai-stage-confirm')
  @HttpCode(HttpStatus.OK)
  async confirmAiStage(@Param('id') id: string) {
    const updated = await this.service.confirmAiStage(id);
    return { status: 'confirmed', workflowStatus: updated.workflowStatus };
  }

  // Fase 3.2 — ambil atribut lead (AI suggestion + confirmed)
  @Get(':id/attributes')
  async getAttributes(@Param('id') id: string) {
    return this.service.getLeadAttributes(id);
  }

  // Fase 3.2 — konfirmasi / tolak / edit satu atribut AI
  @Patch(':id/attributes/:attrId')
  @HttpCode(HttpStatus.OK)
  async confirmAttr(
    @Param('id') id: string,
    @Param('attrId') attrId: string,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.service.confirmAttribute(id, attrId, dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getLead(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.deleteLead(id);
  }
}

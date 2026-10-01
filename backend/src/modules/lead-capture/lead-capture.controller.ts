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
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';
import { LeadStatus, WorkflowStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ── DTO (inline for simplicity) ──
// Every field carries a validation decorator: the global pipe runs with
// `whitelist` + `forbidNonWhitelisted`, so an undeclared field is a hard 400.
// That is exactly what keeps a client from injecting `organizationId`.

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
  @IsOptional() @IsString() assignedName?: string; // Round-robin agent name
  @IsOptional() @IsString() assignedPhone?: string; // Round-robin agent phone
}

class WhatsAppUpdateDto {
  @IsString() phone!: string;
  @IsOptional() @IsString() waName?: string;
  @IsOptional() @IsString() waMessage?: string;
  @IsOptional() @IsString() msgId?: string;
}

class UpdateLeadDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(WorkflowStatus) workflowStatus?: WorkflowStatus;
  @IsOptional() @IsUUID() assignedTo?: string;
  @IsOptional() @IsString() lostReason?: string;
  @IsOptional() @IsString() aiStatus?: string;
}

class UpdateAttributeDto {
  @IsOptional() @IsBoolean() confirmed?: boolean;
  @IsOptional() @IsString() value?: string;
}

class BulkUpdateDto {
  @IsArray() @IsUUID('4', { each: true }) ids!: string[];
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(WorkflowStatus) workflowStatus?: WorkflowStatus;
  @IsOptional() @IsUUID() assignedTo?: string;
}

class ListQueryDto {
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(WorkflowStatus) workflowStatus?: WorkflowStatus;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
}

// ── Controller ──

// CRM lead administration. Applied to every non-public route: the only
// endpoints reachable without a token are the documented intake/webhook ones.
const ADMIN_ROLES: UserRole[] = [
  UserRole.MARKETING,
  UserRole.DIGIMAR,
  UserRole.HEAD_OPS,
  UserRole.COMMERCIAL,
  UserRole.SUPER_ADMIN,
];

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async list(@Query() query: ListQueryDto) {
    return this.service.listLeads(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async stats() {
    return this.service.getStats();
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async dashboard(@Query() query: { dateFrom?: string; dateTo?: string }) {
    return this.service.getDashboardAnalytics(query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.updateLead(id, dto);
  }

  @Post('bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    return this.service.bulkUpdate(dto.ids, dto);
  }

  // ════════════════════════════════════════════════
  //  KOMMO WEBHOOK & SYNC
  // ════════════════════════════════════════════════

  @Post('kommo-webhook')
  @HttpCode(HttpStatus.OK)
  async kommoWebhook(
    @Body() body: any,
    @Headers('x-kommo-secret') headerSecret?: string,
    @Headers('x-webhook-token') tokenSecret?: string,
    @Query('secret') querySecret?: string,
  ) {
    const expectedSecret = process.env.KOMMO_WEBHOOK_SECRET || 'kommo-secret-key';
    const provided = headerSecret || tokenSecret || querySecret;
    if (!provided || provided !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing Kommo webhook secret');
    }

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async kommoStatus() {
    return this.kommo.getAccountStatus();
  }

  @Post('kommo-pull')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  async kommoPull(@Body() body?: { dateFrom?: string; dateTo?: string }) {
    try {
      const result = await this.kommo.pullAllLeads(
        body?.dateFrom,
        body?.dateTo,
      );
      // Save pulled leads to database
      const saved = await this.service.saveKommoLeads(
        result.leads,
        result.contacts,
        result,
      );
      return { pulled: result.leads.length, saved };
    } catch (err: any) {
      return {
        error: err.message || 'Failed to pull from Kommo',
        details:
          'Pastikan KOMMO_API_TOKEN adalah access token aktif untuk subdomain Kommo yang benar',
      };
    }
  }

  @Post('import-csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getRoundRobinStatus() {
    return this.service.getRoundRobinStatus();
  }

  @Post('round-robin/agents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async upsertAgent(
    @Body()
    dto: {
      id?: string;
      name: string;
      phoneNumber: string;
      orderIndex: number;
      isActive?: boolean;
    },
  ) {
    return this.service.upsertRoundRobinAgent(dto);
  }

  @Delete('round-robin/agents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async deleteAgent(@Param('id') id: string) {
    return this.service.deleteRoundRobinAgent(id);
  }

  // Fase 3.1 — jalankan AI extraction manual untuk satu lead
  @Post(':id/ai-extract')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  async aiExtract(@Param('id') id: string) {
    const result = await this.service.extractAiForLead(id);
    if (!result) {
      return {
        status: 'no_result',
        message: 'Tidak ada pesan atau ekstraksi gagal',
      };
    }
    return { status: 'suggested', suggestion: result };
  }

  // Fase 3.3 — terapkan saran pipeline stage (workflowStatus)
  @Post(':id/ai-stage-confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  async confirmAiStage(@Param('id') id: string) {
    const updated = await this.service.confirmAiStage(id);
    return { status: 'confirmed', workflowStatus: updated.workflowStatus };
  }

  // Fase 3.2 — ambil atribut lead (AI suggestion + confirmed)
  @Get(':id/attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getAttributes(@Param('id') id: string) {
    return this.service.getLeadAttributes(id);
  }

  // Fase 3.2 — konfirmasi / tolak / edit satu atribut AI
  @Patch(':id/attributes/:attrId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  async confirmAttr(
    @Param('id') id: string,
    @Param('attrId') attrId: string,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.service.confirmAttribute(id, attrId, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async get(@Param('id') id: string) {
    return this.service.getLead(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async delete(@Param('id') id: string) {
    return this.service.deleteLead(id);
  }
}

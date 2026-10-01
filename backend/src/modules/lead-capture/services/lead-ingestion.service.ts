import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { Prisma, LeadStatus, WorkflowStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { LeadRoundRobinService } from './lead-round-robin.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class LeadIngestionService {
  private readonly logger = new Logger(LeadIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roundRobinService: LeadRoundRobinService,
  ) {}

  generateTrackingCode(): string {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `DL${rand}`;
  }

  resolvePublicOrganizationId(): string {
    const raw = process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID;
    if (typeof raw !== 'string' || !UUID_PATTERN.test(raw.trim())) {
      throw new ServiceUnavailableException({
        code: 'P07_TENANT_UNRESOLVED',
        message:
          'Intake ditolak: organisasi publik belum dikonfigurasi di server.',
      });
    }
    return raw.trim();
  }

  private buildWaUrl(trackingCode: string, intent?: string): string {
    const phone = process.env.WA_BUSINESS_PHONE || '6281234567890';
    let message = `Halo%20DreamLab!`;
    if (intent) {
      message += `%0ASaya%20tertarik%20dengan%3A%20${encodeURIComponent(intent)}`;
    }
    message += `%0A%0A[Kode%3A%20${trackingCode}]`;
    return `https://wa.me/${phone}?text=${message}`;
  }

  private normalizePhone(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '');
  }

  private readonly EXTRACTION_FIELDS = [
    'fullName',
    'company',
    'niche',
    'brand',
    'domisili',
    'moq',
    'budget',
  ] as const;

  private readonly WORKFLOW_STAGES = [
    'NEW_LEAD',
    'CONTACTED',
    'FOLLOW_UP_1',
    'FOLLOW_UP_2',
    'FOLLOW_UP_3',
    'NEGOTIATION',
    'SAMPLE_REQUESTED',
    'SAMPLE_SENT',
    'SAMPLE_APPROVED',
    'SPK_SIGNED',
    'WAITING_FINANCE_APPROVAL',
    'DP_PAID',
    'PRODUCTION_PLAN',
    'READY_TO_SHIP',
    'WON_DEAL',
    'LOST',
    'ABORTED',
  ] as const;

  async track(data: {
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
    assignedName?: string;
    assignedPhone?: string;
  }) {
    const trackingCode = this.generateTrackingCode();
    let assignedName = data.assignedName;
    let assignedPhone = data.assignedPhone;
    if (!assignedName && !assignedPhone) {
      try {
        const agent = await this.roundRobinService.getNextRoundRobinAgent();
        assignedName = agent.name;
        assignedPhone = agent.phoneNumber;
      } catch (err: any) {
        this.logger.warn(
          `⚠️ Round-robin tidak tersedia saat track: ${err?.message || err}`,
        );
      }
    }

    const lead = await this.prisma.leadCapture.create({
      data: {
        trackingCode,
        organizationId: this.resolvePublicOrganizationId(),
        status: 'PENDING' as LeadStatus,
        workflowStatus: 'NEW_LEAD' as WorkflowStatus,
        ...data,
        ...(assignedName ? { assignedName } : {}),
        ...(assignedPhone ? { assignedPhone } : {}),
      },
    });

    this.logger.log(
      `🎯 Lead tracked: ${trackingCode} | intent: ${data.intent || 'N/A'} | page: ${data.pageUrl || 'N/A'}`,
    );

    return {
      trackingCode,
      waUrl: this.buildWaUrl(trackingCode, data.intent),
    };
  }

  async updateFromWhatsApp(
    trackingCode: string,
    data: {
      phone: string;
      waName?: string;
      waMessage?: string;
      msgId?: string;
    },
  ) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { trackingCode },
    });

    let updated: { id: string };
    if (!lead) {
      this.logger.warn(
        `Tracking code ${trackingCode} not found, creating orphan lead`,
      );
      updated = await this.prisma.leadCapture.create({
        data: {
          trackingCode,
          organizationId: this.resolvePublicOrganizationId(),
          phone: data.phone,
          waProfileName: data.waName,
          waMessage: data.waMessage,
          status: 'WA_CONTACTED' as LeadStatus,
          contactedAt: new Date(),
          kommoFirstResponseSec: 0,
        },
      });
    } else {
      updated = await this.prisma.leadCapture.update({
        where: { trackingCode },
        data: {
          organizationId: this.resolvePublicOrganizationId(),
          phone: data.phone,
          waProfileName: data.waName,
          waMessage: data.waMessage,
          status: 'WA_CONTACTED' as LeadStatus,
          contactedAt: new Date(),
          kommoFirstResponseSec:
            lead.createdAt && !lead.kommoFirstResponseSec
              ? Math.round(
                  (Date.now() - new Date(lead.createdAt).getTime()) / 1000,
                )
              : (lead.kommoFirstResponseSec ?? null),
        },
      });
    }

    await this.appendLeadMessage(updated.id, {
      phone: data.phone,
      waName: data.waName,
      body: data.waMessage || '',
      msgId: data.msgId,
    });

    return updated;
  }

  async upsertOrphanLead(
    phone: string,
    waName: string,
    text: string,
    msgId?: string,
  ) {
    const normalizedPhone = this.normalizePhone(phone);
    const organizationId = this.resolvePublicOrganizationId();
    const windowMs =
      Number(process.env.ORPHAN_DEDUP_WINDOW_MS) || 7 * 24 * 60 * 60 * 1000;
    const lockKey = `nex_p07_phone:${normalizedPhone}`;

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

        const existing = await tx.leadCapture.findFirst({
          where: {
            phone: normalizedPhone,
            status: { notIn: ['CONVERTED', 'DISQUALIFIED'] as LeadStatus[] },
            workflowStatus: {
              notIn: ['WON_DEAL', 'LOST', 'ABORTED'] as WorkflowStatus[],
            },
            createdAt: { gte: new Date(Date.now() - windowMs) },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existing) {
          this.logger.log(
            `🔄 Dedup: ${normalizedPhone} → update lead ${existing.trackingCode}`,
          );
          const updated = await tx.leadCapture.update({
            where: { id: existing.id },
            data: {
              organizationId,
              phone: normalizedPhone,
              waMessage: text,
              status: 'WA_CONTACTED' as LeadStatus,
              contactedAt: new Date(),
            },
          });
          if (msgId) {
            const dup = await tx.leadMessage.findUnique({ where: { msgId } });
            if (dup) return updated;
          }
          await tx.leadMessage.create({
            data: {
              leadId: updated.id,
              direction: 'INBOUND',
              phone: normalizedPhone,
              waName: waName || null,
              body: text,
              msgId: msgId || null,
            },
          });
          return updated;
        }

        this.logger.log(`✨ Orphan baru: ${normalizedPhone}`);
        const trackingCode = this.generateTrackingCode();
        const created = await tx.leadCapture.create({
          data: {
            trackingCode,
            organizationId,
            status: 'WA_CONTACTED' as LeadStatus,
            workflowStatus: 'NEW_LEAD' as WorkflowStatus,
            phone: normalizedPhone,
            waProfileName: waName,
            waMessage: text,
            contactedAt: new Date(),
            intent: 'WhatsApp Direct',
            pageUrl: 'wa-direct',
            kommoFirstResponseSec: 0,
          },
        });
        if (msgId) {
          const dup = await tx.leadMessage.findUnique({ where: { msgId } });
          if (dup) return created;
        }
        await tx.leadMessage.create({
          data: {
            leadId: created.id,
            direction: 'INBOUND',
            phone: normalizedPhone,
            waName: waName || null,
            body: text,
            msgId: msgId || null,
          },
        });
        return created;
      },
      { timeout: 10000 },
    );
  }

  private async appendLeadMessage(
    leadId: string,
    data: { phone?: string; waName?: string; body: string; msgId?: string },
  ) {
    if (data.msgId) {
      const existingMsg = await this.prisma.leadMessage.findUnique({
        where: { msgId: data.msgId },
      });
      if (existingMsg) {
        this.logger.log(`⏭️ Duplicate msgId ${data.msgId} — skip append`);
        return;
      }
    }

    await this.prisma.leadMessage.create({
      data: {
        leadId,
        direction: 'INBOUND',
        phone: data.phone || null,
        waName: data.waName || null,
        body: data.body,
        msgId: data.msgId || null,
      },
    });

    void this.maybeAutoExtract(leadId);
    void this.maybeExtractAndUpdateName(leadId);
  }

  async extractName(conversationText: string): Promise<{
    name: string | null;
    confidence: number;
  }> {
    const baseUrl = process.env.MINIMAX_BASE_URL;
    const apiKey = process.env.MINIMAX_API_KEY;
    const model = process.env.MINIMAX_MODEL || 'MiniMax-M3';

    const systemPrompt = `Kamu adalah asisten ekstraksi nama dari percakapan WhatsApp customer service.
Ekstrak nama asli customer dari teks. Hanya nama orang, bukan nama perusahaan atau produk.
Balas JSON:
- {"name": "Nama Customer", "confidence": 0.0-1.0} jika ada
- {"name": null, "confidence": 0.0} jika tidak ada`;

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationText },
          ],
          temperature: 0.1,
          max_tokens: 100,
        }),
      });

      if (!resp.ok) throw new Error(`MiniMax API error ${resp.status}`);
      const data: any = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('MiniMax returned empty content');

      const parsed = JSON.parse(content);
      return {
        name: parsed.name ?? null,
        confidence: Number(parsed.confidence) || 0,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ extractName error: ${err.message}`);
      return { name: null, confidence: 0 };
    }
  }

  private async maybeExtractAndUpdateName(leadId: string): Promise<void> {
    try {
      const messages = await this.prisma.leadMessage.findMany({
        where: { leadId, direction: 'INBOUND' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      if (!messages.length) return;

      const conversationText = messages
        .reverse()
        .map((m) => m.body)
        .join('\n');
      const { name, confidence } = await this.extractName(conversationText);
      if (!name || confidence < 0.5) return;

      const lead = await this.prisma.leadCapture.findUnique({
        where: { id: leadId },
      });
      if (!lead) return;

      if (lead.extractedFullName && (lead.nameConfidence ?? 0) >= confidence)
        return;

      await this.prisma.leadCapture.update({
        where: { id: leadId },
        data: {
          extractedFullName: name,
          nameConfidence: confidence,
          nameMatch: lead.waProfileName
            ? lead.waProfileName.toLowerCase() === name.toLowerCase()
            : null,
          approvalNeeded: confidence < 0.85,
        },
      });

      await this.prisma.leadValidationLog.create({
        data: {
          leadId,
          type: 'NAME_EXTRACT',
          input: conversationText,
          output: JSON.stringify({ name, confidence }),
          confidence,
          action: confidence >= 0.85 ? 'SAVED' : 'FLAGGED',
        },
      });
    } catch (err: any) {
      this.logger.warn(
        `maybeExtractAndUpdateName failed for ${leadId}: ${err.message}`,
      );
    }
  }

  async extractAiForLead(leadId: string): Promise<any | null> {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { id: leadId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!lead || !lead.messages || lead.messages.length === 0) {
      return null;
    }

    const conversation = this.buildConversationText(lead.messages);
    let rawContent: string;
    try {
      rawContent = await this.callExtractionLlm(conversation);
    } catch (err: any) {
      await this.prisma.leadCapture.update({
        where: { id: leadId },
        data: { aiStatus: 'ERROR', aiExtractedAt: new Date() },
      });
      return null;
    }

    const parsed = this.parseAndValidateExtraction(rawContent);
    if (!parsed) {
      await this.prisma.leadCapture.update({
        where: { id: leadId },
        data: { aiStatus: 'ERROR', aiExtractedAt: new Date() },
      });
      return null;
    }

    const existingConfirmed = await this.prisma.leadAttribute.findMany({
      where: { leadId, confirmed: true },
      select: { key: true },
    });
    const confirmedKeys = new Set(existingConfirmed.map((e) => e.key));

    const suggestions = this.EXTRACTION_FIELDS.filter(
      (key) => !confirmedKeys.has(key),
    )
      .map((key) => {
        const f = parsed[key] || { value: null, confidence: 0, source: null };
        const strValue = f.value === null ? null : String(f.value);
        return {
          key,
          value: strValue,
          confidence: f.confidence,
          source: f.source,
        };
      })
      .filter((s) => s.value !== null);

    if (suggestions.length > 0) {
      await this.prisma.$transaction(
        suggestions.map((s) =>
          this.prisma.leadAttribute.upsert({
            where: { leadId_key: { leadId, key: s.key } },
            create: { leadId, ...s, confirmed: false },
            update: {
              value: s.value,
              confidence: s.confidence,
              source: s.source,
            },
          }),
        ),
      );
    }

    const stageSuggestion =
      parsed?.stage?.stage && parsed.stage.stage !== lead.workflowStatus
        ? parsed.stage
        : null;

    await this.prisma.leadCapture.update({
      where: { id: leadId },
      data: {
        aiExtractedAt: new Date(),
        aiStatus: 'SUGGESTED',
        aiStage: stageSuggestion || undefined,
      },
    });
    return parsed;
  }

  async confirmAiStage(leadId: string) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { id: leadId },
    });
    if (!lead) throw new NotFoundException('Lead tidak ditemukan');

    const stage = (lead as any).aiStage as {
      stage?: string;
      confidence?: number;
      reason?: string;
    } | null;
    if (!stage?.stage) {
      throw new NotFoundException('Tidak ada saran stage untuk lead ini');
    }

    const updated = await this.prisma.leadCapture.update({
      where: { id: leadId },
      data: {
        workflowStatus: stage.stage as WorkflowStatus,
        aiStage: Prisma.DbNull,
        aiStatus: 'CONFIRMED',
      },
    });
    return updated;
  }

  async confirmAttribute(
    leadId: string,
    attrId: string,
    dto: { confirmed?: boolean; value?: string },
  ) {
    const attr = await this.prisma.leadAttribute.findFirst({
      where: { id: attrId, leadId },
    });
    if (!attr) throw new NotFoundException('Atribut tidak ditemukan');

    const value = dto.value !== undefined ? dto.value : attr.value;
    const confirmed =
      dto.confirmed !== undefined ? dto.confirmed : attr.confirmed;

    const updated = await this.prisma.leadAttribute.update({
      where: { id: attrId },
      data: { value, confirmed },
    });

    if (attr.key === 'fullName' && value) {
      await this.prisma.leadCapture.update({
        where: { id: leadId },
        data: { fullName: value },
      });
    } else if (attr.key === 'company' && value) {
      await this.prisma.leadCapture.update({
        where: { id: leadId },
        data: { company: value },
      });
    }

    const remaining = await this.prisma.leadAttribute.count({
      where: { leadId, confirmed: false },
    });
    await this.prisma.leadCapture.update({
      where: { id: leadId },
      data: { aiStatus: remaining === 0 ? 'CONFIRMED' : 'SUGGESTED' },
    });

    return updated;
  }

  async getLeadAttributes(leadId: string) {
    return this.prisma.leadAttribute.findMany({
      where: { leadId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildConversationText(
    messages: { body: string; waName?: string | null; createdAt: Date }[],
  ): string {
    return messages
      .map((m, i) => {
        const who = m.waName ? `[customer (${m.waName})]` : '[customer]';
        return `${i + 1}. ${m.createdAt.toISOString()} ${who}: ${m.body}`;
      })
      .join('\n');
  }

  private async callExtractionLlm(conversationText: string): Promise<string> {
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.LLM_API_KEY || '';
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('LLM_API_KEY belum diisi di .env');
    }

    const systemPrompt = `Kamu adalah asisten CRM untuk perusahaan manufaktur kosmetik. Dari percakapan WhatsApp berikut, ekstrak informasi lead ke dalam JSON.`;

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText },
        ],
      }),
    });

    if (!resp.ok) {
      throw new Error(`LLM API error ${resp.status}`);
    }

    const data: any = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('LLM returned empty content');
    return content as string;
  }

  private parseAndValidateExtraction(rawContent: string): any | null {
    let content = rawContent.trim();
    const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) content = fence[1].trim();

    let obj: any;
    try {
      obj = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        obj = JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    const result: any = {};
    for (const key of this.EXTRACTION_FIELDS) {
      const raw = obj?.[key];
      if (!raw || typeof raw !== 'object') {
        result[key] = { value: null, confidence: 0, source: null };
        continue;
      }
      const value = raw.value ?? null;
      const confidence = Math.min(Math.max(Number(raw.confidence) || 0, 0), 1);
      const source = typeof raw.source === 'string' ? raw.source : null;

      if (key === 'moq') {
        const isNum =
          typeof value === 'number' && Number.isFinite(value) && value > 0;
        result[key] = {
          value: isNum ? Math.round(value) : null,
          confidence: isNum ? confidence : 0,
          source: isNum ? source : null,
        };
      } else {
        const isStr = typeof value === 'string' && value.trim().length > 0;
        result[key] = {
          value: isStr ? value.trim() : null,
          confidence: isStr ? confidence : 0,
          source: isStr ? source : null,
        };
      }
    }

    const stageRaw = obj?.stage;
    if (stageRaw && typeof stageRaw === 'object') {
      const knownStages = new Set<string>(this.WORKFLOW_STAGES);
      const stageVal =
        typeof stageRaw.stage === 'string' ? stageRaw.stage : null;
      const stage = stageVal && knownStages.has(stageVal) ? stageVal : null;
      result.stage = {
        stage,
        confidence: stage
          ? Math.min(Math.max(Number(stageRaw.confidence) || 0, 0), 1)
          : 0,
        reason:
          stage && typeof stageRaw.reason === 'string' ? stageRaw.reason : null,
        source:
          stage && typeof stageRaw.source === 'string' ? stageRaw.source : null,
      };
    } else {
      result.stage = { stage: null, confidence: 0, reason: null, source: null };
    }

    return result;
  }

  private async maybeAutoExtract(leadId: string): Promise<void> {
    try {
      const [msgCount, lead] = await Promise.all([
        this.prisma.leadMessage.count({ where: { leadId } }),
        this.prisma.leadCapture.findUnique({
          where: { id: leadId },
          select: { aiExtractedAt: true, aiStatus: true },
        }),
      ]);
      if (msgCount < 2) return;
      if (lead?.aiStatus === 'REJECTED') return;
      const sixHours = 6 * 60 * 60 * 1000;
      if (
        lead?.aiExtractedAt &&
        Date.now() - lead.aiExtractedAt.getTime() < sixHours
      )
        return;
      await this.extractAiForLead(leadId);
    } catch (err) {
      this.logger.error(`❌ maybeAutoExtract gagal untuk ${leadId}:`, err);
    }
  }

  async updateLead(
    id: string,
    data: {
      fullName?: string;
      company?: string;
      email?: string;
      phone?: string;
      notes?: string;
      status?: LeadStatus;
      workflowStatus?: WorkflowStatus;
      assignedTo?: string;
      lostReason?: string;
    },
  ) {
    const lead = await this.prisma.leadCapture.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.workflowStatus !== undefined)
      updateData.workflowStatus = data.workflowStatus;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason;

    if (data.status === 'CONVERTED') updateData.wonAt = new Date();
    if (data.workflowStatus === 'LOST' || data.workflowStatus === 'ABORTED') {
      updateData.lostAt = new Date();
    }

    return this.prisma.leadCapture.update({
      where: { id },
      data: updateData,
    });
  }

  async listLeads(query: {
    status?: LeadStatus;
    workflowStatus?: WorkflowStatus;
    source?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    noPhone?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.workflowStatus) where.workflowStatus = query.workflowStatus;
    if (query.source) where.source = query.source;
    if (
      query.noPhone &&
      ['1', 'true'].includes(String(query.noPhone).toLowerCase())
    ) {
      where.phone = null;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { trackingCode: { contains: query.search, mode: 'insensitive' } },
        { intent: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.leadCapture.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          assignedUser: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.leadCapture.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLead(id: string) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, fullName: true, email: true } },
        attributes: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async getStats() {
    const [total, byStatus, bySource, today, thisWeek, thisMonth] =
      await Promise.all([
        this.prisma.leadCapture.count(),
        this.prisma.leadCapture.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.leadCapture.groupBy({
          by: ['source'],
          _count: true,
        }),
        this.prisma.leadCapture.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        this.prisma.leadCapture.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        }),
        this.prisma.leadCapture.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        }),
      ]);

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      byStatus: byStatus.reduce(
        (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
        {} as Record<string, number>,
      ),
      bySource: bySource.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.source || 'UNKNOWN']: curr._count,
        }),
        {} as Record<string, number>,
      ),
    };
  }

  async getDashboardAnalytics(query?: { dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (query?.dateFrom || query?.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      total,
      byStatus,
      byWorkflow,
      assignedStatus,
      assignedWorkflow,
      leads,
      unassigned,
      noPhone,
      noName,
      pendingOver24h,
      newLast7Days,
      won,
      lost,
      kommoImported,
      websiteTracked,
      csvImported,
    ] = await Promise.all([
      this.prisma.leadCapture.count({ where }),
      this.prisma.leadCapture.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.leadCapture.groupBy({
        by: ['workflowStatus'],
        where,
        _count: true,
      }),
      this.prisma.leadCapture.groupBy({
        by: ['assignedTo', 'status'],
        where,
        _count: true,
      }),
      this.prisma.leadCapture.groupBy({
        by: ['assignedTo', 'workflowStatus'],
        where,
        _count: true,
      }),
      this.prisma.leadCapture.findMany({
        where,
        select: {
          id: true,
          trackingCode: true,
          source: true,
          utmSource: true,
          assignedTo: true,
          kommoPipelineName: true,
          kommoStatusName: true,
          kommoSourceName: true,
          kommoTags: true,
          kommoTalkStatus: true,
          kommoTalkIsRead: true,
          kommoTalkIsInWork: true,
          kommoFirstResponseSec: true,
          status: true,
          workflowStatus: true,
          createdAt: true,
          contactedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leadCapture.count({ where: { ...where, assignedTo: null } }),
      this.prisma.leadCapture.count({ where: { ...where, phone: null } }),
      this.prisma.leadCapture.count({
        where: { ...where, fullName: null, waProfileName: null },
      }),
      this.prisma.leadCapture.count({
        where: {
          ...where,
          status: 'PENDING',
          createdAt: { ...(where.createdAt || {}), lte: oneDayAgo },
        },
      }),
      this.prisma.leadCapture.count({
        where: {
          ...where,
          createdAt: { ...(where.createdAt || {}), gte: sevenDaysAgo },
        },
      }),
      this.prisma.leadCapture.count({
        where: { ...where, workflowStatus: 'WON_DEAL' },
      }),
      this.prisma.leadCapture.count({
        where: { ...where, workflowStatus: 'LOST' },
      }),
      this.prisma.leadCapture.count({
        where: { ...where, trackingCode: { startsWith: 'KM' } },
      }),
      this.prisma.leadCapture.count({
        where: { ...where, trackingCode: { startsWith: 'DL' } },
      }),
      this.prisma.leadCapture.count({
        where: { ...where, trackingCode: { startsWith: 'CSV' } },
      }),
    ]);

    const userIds = Array.from(
      new Set(leads.map((lead) => lead.assignedTo).filter(Boolean) as string[]),
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    const sourceMap = new Map<string, number>();
    const dailyMap = new Map<string, number>();
    for (const lead of leads) {
      const source = this.normalizeAnalyticsSource(lead);
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

      if (lead.createdAt >= fourteenDaysAgo) {
        const key = lead.createdAt.toISOString().slice(0, 10);
        dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
      }
    }

    const busdevMap = new Map<string, any>();
    for (const lead of leads) {
      const busdevName = this.extractBusdevName(lead.kommoPipelineName);
      const key = busdevName || lead.assignedTo || 'UNASSIGNED';
      const user = lead.assignedTo ? userMap.get(lead.assignedTo) : null;
      if (!busdevMap.has(key)) {
        busdevMap.set(key, {
          id: key,
          name: busdevName || user?.fullName || user?.email || 'Unassigned',
          email: user?.email || null,
          total: 0,
          contacted: 0,
          qualified: 0,
          won: 0,
          lost: 0,
          active: 0,
          conversationsInWork: 0,
          unanswered: 0,
          avgResponseSec: null,
          responseSamples: 0,
          byStatus: {},
          byWorkflow: {},
        });
      }
      const item = busdevMap.get(key);
      item.total++;
      item.byStatus[lead.status] = (item.byStatus[lead.status] || 0) + 1;
      item.byWorkflow[lead.workflowStatus] =
        (item.byWorkflow[lead.workflowStatus] || 0) + 1;
      if (lead.status === 'WA_CONTACTED') item.contacted++;
      if (lead.status === 'QUALIFIED') item.qualified++;
      if (lead.workflowStatus === 'WON_DEAL') item.won++;
      if (lead.workflowStatus === 'LOST') item.lost++;
      if (!['WON_DEAL', 'LOST', 'ABORTED'].includes(lead.workflowStatus))
        item.active++;
      if (lead.kommoTalkIsInWork || lead.kommoTalkStatus === 'in_work')
        item.conversationsInWork++;
      if (lead.kommoTalkIsRead === false) item.unanswered++;
      if (lead.kommoFirstResponseSec != null) {
        item._responseTotal =
          (item._responseTotal || 0) + lead.kommoFirstResponseSec;
        item.responseSamples++;
      }
    }

    for (const row of assignedStatus) {
      const item = busdevMap.get(row.assignedTo || 'UNASSIGNED');
      if (item) item.byStatus[row.status] = row._count;
    }
    for (const row of assignedWorkflow) {
      const item = busdevMap.get(row.assignedTo || 'UNASSIGNED');
      if (item) item.byWorkflow[row.workflowStatus] = row._count;
    }

    const qualified =
      byStatus.find((row) => row.status === 'QUALIFIED')?._count || 0;
    const busdev = Array.from(busdevMap.values())
      .map((item) => ({
        ...item,
        _responseTotal: undefined,
        avgResponseSec:
          item.responseSamples > 0
            ? Math.round(item._responseTotal / item.responseSamples)
            : null,
        conversionRate: item.total > 0 ? item.won / item.total : 0,
        qualificationRate: item.total > 0 ? item.qualified / item.total : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const conversationsInWork = leads.filter(
      (lead) => lead.kommoTalkIsInWork || lead.kommoTalkStatus === 'in_work',
    ).length;
    const unanswered = leads.filter(
      (lead) => lead.kommoTalkIsRead === false,
    ).length;
    const responseSamples = leads.filter(
      (lead) => lead.kommoFirstResponseSec != null,
    );
    const avgResponseSec = responseSamples.length
      ? Math.round(
          responseSamples.reduce(
            (sum, lead) => sum + (lead.kommoFirstResponseSec || 0),
            0,
          ) / responseSamples.length,
        )
      : null;

    return {
      total,
      newLast7Days,
      conversionRate: total > 0 ? won / total : 0,
      qualificationRate: total > 0 ? qualified / total : 0,
      byStatus: byStatus.reduce(
        (acc, row) => ({ ...acc, [row.status]: row._count }),
        {},
      ),
      byWorkflow: byWorkflow.reduce(
        (acc, row) => ({ ...acc, [row.workflowStatus]: row._count }),
        {},
      ),
      bySource: Object.fromEntries(
        [...sourceMap.entries()].sort((a, b) => b[1] - a[1]),
      ),
      dailyTrend: [...dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      busdev,
      dataQuality: {
        unassigned,
        noPhone,
        noName,
        pendingOver24h,
      },
      conversations: {
        inWork: conversationsInWork,
        unanswered,
        avgResponseSec,
        responseSamples: responseSamples.length,
      },
      importSources: {
        kommoImported,
        websiteTracked,
        csvImported,
      },
      won,
      lost,
    };
  }

  private normalizeAnalyticsSource(lead: {
    source: unknown;
    utmSource: string | null;
    trackingCode: string;
    kommoSourceName?: string | null;
    kommoStatusName?: string | null;
    kommoPipelineName?: string | null;
    kommoTags?: string | null;
  }): string {
    const raw = [
      lead.kommoSourceName,
      lead.kommoStatusName,
      lead.kommoTags,
      lead.kommoPipelineName,
      lead.utmSource,
      lead.source,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (raw.includes('link tree') || raw.includes('linktree'))
      return 'Linktree';
    if (raw.includes('tiktok') || raw.includes('tik tok')) return 'TikTok';
    if (raw.includes('meta')) return 'Meta Ads';
    if (
      raw.includes('instagram') ||
      raw.includes('ig/fb') ||
      raw.includes(' dm')
    )
      return 'Instagram DM';
    if (raw.includes('google')) return 'Google';
    if (
      raw.includes('sales smaple') ||
      raw.includes('sales sample') ||
      raw.includes('sample')
    )
      return 'Sales Sample';
    if (raw.includes('webinar')) return 'Webinar';
    if (raw.includes('webform') || raw.includes('website')) return 'Website';
    if (lead.source) return String(lead.source);
    if (lead.utmSource) return lead.utmSource.toUpperCase();
    if (lead.trackingCode.startsWith('CSV')) return 'CSV Import';
    if (lead.trackingCode.startsWith('DL')) return 'Website WA';
    return 'UNKNOWN';
  }

  private extractBusdevName(pipelineName?: string | null): string | null {
    if (!pipelineName) return null;
    const normalized = pipelineName.toLowerCase();
    if (normalized.includes('jessica')) return 'Jessica';
    if (normalized.includes('ami')) return 'Ami';
    if (normalized.includes('sansan')) return 'Sansan';
    if (normalized.includes('dilla') || normalized.includes('dila'))
      return 'Bu Dilla';
    if (normalized.includes('anisa')) return 'Anisa';
    if (normalized.includes('mutmah')) return 'Mutmah';
    if (normalized.includes('shierly')) return 'Bu Shierly';
    if (normalized.includes('mada')) return 'Bu Mada';
    if (normalized.includes('round robin')) return 'Round Robin';
    return pipelineName
      .replace(/_/g, ' ')
      .replace(/\s*pipeline\s*busdev\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async bulkUpdate(
    ids: string[],
    data: {
      status?: LeadStatus;
      workflowStatus?: WorkflowStatus;
      assignedTo?: string;
    },
  ) {
    const updateData: any = { ...data };
    if (data.status === 'CONVERTED') updateData.wonAt = new Date();

    await this.prisma.leadCapture.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return { updated: ids.length };
  }

  async deleteLead(id: string) {
    const lead = await this.prisma.leadCapture.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.leadCapture.delete({ where: { id } });
    return { deleted: true };
  }

  async findLeadsWithoutName(limit = 50) {
    return this.prisma.leadCapture.findMany({
      where: {
        phone: { not: null },
        waProfileName: null,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async classifyIntent(text: string): Promise<{
    intent: 'PROSPEK' | 'SPAM' | 'JUNK' | 'UNCLEAR';
    confidence: number;
    reasoning?: string;
  }> {
    const baseUrl = process.env.MINIMAX_BASE_URL;
    const apiKey = process.env.MINIMAX_API_KEY;
    const model = process.env.MINIMAX_MODEL || 'MiniMax-M3';

    const systemPrompt = `Kamu adalah filter spam untuk chat WhatsApp customer service perusahaan manufaktur kosmetik.
Klasifikasikan pesan berikut ke salah satu:
- PROSPEK: calon customer nyata (bertanya produk, minta sample, minta penawaran)
- SPAM: pinjol/slot/gacor/iklan tidak relevan
- JUNK: pesan tidak bermakna (test, abc, emoji saja, <2 kata)
- UNCLEAR: tidak yakin, butuh review manusia
Balas JSON: {"intent": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          temperature: 0.1,
          max_tokens: 150,
        }),
      });

      if (!resp.ok) {
        throw new Error(`MiniMax API error ${resp.status}`);
      }

      const data: any = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('MiniMax returned empty content');

      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent,
        confidence: Number(parsed.confidence) || 0,
        reasoning: parsed.reasoning,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ classifyIntent error: ${err.message}`);
      return { intent: 'UNCLEAR', confidence: 0, reasoning: err.message };
    }
  }
}

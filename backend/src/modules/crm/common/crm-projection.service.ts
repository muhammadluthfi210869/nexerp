import { Injectable, Logger } from '@nestjs/common';
import { LeadSource } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CrmEventsService } from './crm-events.service';

export interface ExternalLeadInput {
  leadCaptureId?: string;
  trackingCode?: string;
  phone?: string | null;
  displayName?: string | null;
  source?: string | null;
  pageUrl?: string | null;
  pageTitle?: string | null;
  referrer?: string | null;
  intent?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  assignedName?: string | null;
  assignedPhone?: string | null;
  assignedExternalId?: string | null;
}

type SourceProjection = {
  source: LeadSource;
  sourceRaw: string | null;
  sourceChannel: string;
};

@Injectable()
export class CrmProjectionService {
  private readonly logger = new Logger(CrmProjectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: CrmEventsService,
  ) {}

  normalizePhone(value?: string | null): string | null {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('62')) return digits;
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    return `62${digits}`;
  }

  normalizeSource(value?: string | null): SourceProjection {
    const raw = value?.trim() || null;
    const key = (raw ?? '').toLowerCase().replace(/[\s_]+/g, '-');
    const map: Record<string, SourceProjection> = {
      direct: { source: LeadSource.DIRECT, sourceRaw: raw, sourceChannel: 'DIRECT' },
      organic: { source: LeadSource.WEBSITE, sourceRaw: raw, sourceChannel: 'ORGANIC' },
      google: { source: LeadSource.GOOGLE, sourceRaw: raw, sourceChannel: 'GOOGLE_ADS' },
      'google-ads': { source: LeadSource.GOOGLE, sourceRaw: raw, sourceChannel: 'GOOGLE_ADS' },
      metaads: { source: LeadSource.INSTAGRAM, sourceRaw: raw, sourceChannel: 'META_ADS' },
      'meta-ads': { source: LeadSource.INSTAGRAM, sourceRaw: raw, sourceChannel: 'META_ADS' },
      instagram: { source: LeadSource.INSTAGRAM, sourceRaw: raw, sourceChannel: 'SOCIAL' },
      medsos: { source: LeadSource.INSTAGRAM, sourceRaw: raw, sourceChannel: 'SOCIAL' },
      social: { source: LeadSource.INSTAGRAM, sourceRaw: raw, sourceChannel: 'SOCIAL' },
      tiktok: { source: LeadSource.TIKTOK, sourceRaw: raw, sourceChannel: 'TIKTOK' },
      linktree: { source: LeadSource.LINKTREE, sourceRaw: raw, sourceChannel: 'LINKTREE' },
      referral: { source: LeadSource.REFERRAL, sourceRaw: raw, sourceChannel: 'REFERRAL' },
      offline: { source: LeadSource.OFFLINE, sourceRaw: raw, sourceChannel: 'OFFLINE' },
      website: { source: LeadSource.WEBSITE, sourceRaw: raw, sourceChannel: 'WEBSITE' },
    };
    return map[key] ?? { source: LeadSource.WEBSITE, sourceRaw: raw, sourceChannel: raw ? 'UNKNOWN' : 'WEBSITE' };
  }

  async ingestExternal(input: ExternalLeadInput) {
    const trackingCode = input.trackingCode?.trim() || `DL-EXT-${input.leadCaptureId ?? Date.now()}`.slice(0, 20);
    const phone = this.normalizePhone(input.phone);
    const source = this.normalizeSource(input.source);

    const capture = await this.prisma.leadCapture.upsert({
      where: { trackingCode },
      create: {
        trackingCode,
        phone,
        waProfileName: this.cleanName(input.displayName),
        source: source.source,
        pageUrl: input.pageUrl ?? null,
        pageTitle: input.pageTitle ?? null,
        referrer: input.referrer ?? null,
        intent: input.intent ?? null,
        deviceType: input.deviceType ?? null,
        browser: input.browser ?? null,
        assignedName: input.assignedName ?? null,
        assignedPhone: this.normalizePhone(input.assignedPhone),
      },
      update: {
        ...(phone ? { phone } : {}),
        ...(this.cleanName(input.displayName) ? { waProfileName: this.cleanName(input.displayName) } : {}),
        source: source.source,
        pageUrl: input.pageUrl ?? undefined,
        pageTitle: input.pageTitle ?? undefined,
        referrer: input.referrer ?? undefined,
        intent: input.intent ?? undefined,
        deviceType: input.deviceType ?? undefined,
        browser: input.browser ?? undefined,
        assignedName: input.assignedName ?? undefined,
        assignedPhone: this.normalizePhone(input.assignedPhone) ?? undefined,
      },
    });
    return this.syncLeadCapture(capture.id, input.source, input.assignedExternalId);
  }

  async syncLeadCapture(leadCaptureId: string, rawSource?: string | null, assignedExternalId?: string | null) {
    const capture = await this.prisma.leadCapture.findUnique({ where: { id: leadCaptureId } });
    if (!capture) return null;
    const source = this.normalizeSource(rawSource ?? capture.utmSource ?? capture.source);
    const agent = await this.resolveAgent(capture.assignedPhone, capture.assignedName, assignedExternalId);
    const displayName = this.cleanName(capture.waProfileName)
      ?? this.cleanName(capture.extractedFullName)
      ?? this.cleanName(capture.fullName);
    const [firstInbound, lastInbound, firstOutbound, lastOutbound] = await Promise.all([
      this.prisma.leadMessage.findFirst({ where: { leadId: capture.id, direction: 'INBOUND' }, orderBy: { createdAt: 'asc' } }),
      this.prisma.leadMessage.findFirst({ where: { leadId: capture.id, direction: 'INBOUND' }, orderBy: { createdAt: 'desc' } }),
      this.prisma.leadMessage.findFirst({ where: { leadId: capture.id, direction: 'OUTBOUND' }, orderBy: { createdAt: 'asc' } }),
      this.prisma.leadMessage.findFirst({ where: { leadId: capture.id, direction: 'OUTBOUND' }, orderBy: { createdAt: 'desc' } }),
    ]);
    const firstResponse = firstOutbound
      ? await this.prisma.leadMessage.findFirst({
          where: { leadId: capture.id, direction: 'INBOUND', createdAt: { gte: firstOutbound.createdAt } },
          orderBy: { createdAt: 'asc' },
        })
      : null;
    const existed = await this.prisma.crmLead.findUnique({ where: { leadCaptureId: capture.id }, select: { id: true } });

    const result = await this.prisma.$transaction(async (tx) => {
      const lead = await tx.crmLead.upsert({
        where: { leadCaptureId: capture.id },
        create: {
          leadCaptureId: capture.id,
          trackingCode: capture.trackingCode,
          phone: this.normalizePhone(capture.phone),
          displayName,
          ...source,
          pageUrl: capture.pageUrl,
          pageTitle: capture.pageTitle,
          referrer: capture.referrer,
          intent: capture.intent,
          deviceType: capture.deviceType,
          browser: capture.browser,
          assignedToId: capture.assignedTo ?? agent?.userId ?? null,
          assignedAgentId: agent?.id ?? null,
          assignedAgentName: capture.assignedName ?? agent?.name ?? null,
          firstInboundAt: firstInbound?.createdAt ?? capture.contactedAt,
          lastInboundAt: lastInbound?.createdAt ?? capture.contactedAt,
          firstOutboundAt: firstOutbound?.createdAt ?? null,
          lastOutboundAt: lastOutbound?.createdAt ?? null,
          firstResponseAt: firstResponse?.createdAt ?? null,
          createdAt: capture.createdAt,
        },
        update: {
          phone: this.normalizePhone(capture.phone),
          ...(displayName ? { displayName } : {}),
          ...source,
          pageUrl: capture.pageUrl,
          pageTitle: capture.pageTitle,
          referrer: capture.referrer,
          intent: capture.intent,
          deviceType: capture.deviceType,
          browser: capture.browser,
          assignedToId: capture.assignedTo ?? agent?.userId ?? undefined,
          assignedAgentId: agent?.id ?? undefined,
          assignedAgentName: capture.assignedName ?? agent?.name ?? undefined,
          firstInboundAt: firstInbound?.createdAt ?? capture.contactedAt ?? undefined,
          lastInboundAt: lastInbound?.createdAt ?? capture.contactedAt ?? undefined,
          firstOutboundAt: firstOutbound?.createdAt ?? undefined,
          lastOutboundAt: lastOutbound?.createdAt ?? undefined,
          firstResponseAt: firstResponse?.createdAt ?? undefined,
        },
      });
      await tx.guestbookEvent.upsert({
        where: { crmLeadId: lead.id },
        create: {
          crmLeadId: lead.id,
          pageUrl: capture.pageUrl ?? '(unknown)',
          pageTitle: capture.pageTitle,
          referrer: capture.referrer,
          intent: capture.intent,
          source: source.sourceChannel,
          createdAt: capture.createdAt,
        },
        update: {
          pageUrl: capture.pageUrl ?? '(unknown)',
          pageTitle: capture.pageTitle,
          referrer: capture.referrer,
          intent: capture.intent,
          source: source.sourceChannel,
        },
      });
      if (!existed) {
        await tx.leadAudit.create({
          data: { crmLeadId: lead.id, action: 'INGEST', metadata: { via: 'lead-capture-projection', sourceRaw: source.sourceRaw } },
        });
      }
      return lead;
    });

    this.events.emit(existed ? 'crm.lead.updated' : 'crm.lead.created', result.id);
    this.events.emit('crm.kpi.invalidated', result.id);
    return result;
  }

  private cleanName(value?: string | null): string | null {
    const name = value?.trim();
    return name && name.toLowerCase() !== 'unknown' && !/^prospek\s+dl/i.test(name)
      ? name
      : null;
  }

  private async resolveAgent(phone?: string | null, name?: string | null, externalKey?: string | null) {
    const agents = await this.prisma.roundRobinAgent.findMany();
    const normalizedPhone = this.normalizePhone(phone);
    const normalizedName = (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return agents.find((agent) =>
      (externalKey && agent.externalKey === externalKey) ||
      (normalizedPhone && this.normalizePhone(agent.phoneNumber) === normalizedPhone) ||
      (normalizedName && (
        agent.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedName) ||
        normalizedName.includes(agent.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
      )),
    ) ?? null;
  }
}

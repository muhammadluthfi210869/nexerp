import {
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { LeadSource, LeadStatus, WorkflowStatus } from '@prisma/client';

@Injectable()
export class LeadKommoSyncService {
  private readonly logger = new Logger(LeadKommoSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveKommoLeads(
    leads: any[],
    contacts: any[],
    metadata?: {
      pipelines?: any[];
      users?: any[];
      talks?: any[];
      events?: any[];
    },
  ): Promise<number> {
    const contactMap = new Map<string, any>();
    for (const c of contacts) {
      contactMap.set(String(c.id), c);
    }
    const pipelineMap = this.buildPipelineMap(metadata?.pipelines ?? []);
    const userMap = new Map(
      (metadata?.users ?? []).map((user) => [Number(user.id), user]),
    );
    const talkMap = this.buildTalkMap(metadata?.talks ?? []);
    const responseMap = this.buildFirstResponseMap(metadata?.events ?? []);

    let saved = 0;
    let updated = 0;
    for (let i = 0; i < leads.length; i += 500) {
      const batch = leads.slice(i, i + 500);
      const trackingCodes = batch.map((lead) => `KM${lead.id}`);
      const existing = await this.prisma.leadCapture.findMany({
        where: { trackingCode: { in: trackingCodes } },
        select: { trackingCode: true },
      });
      const existingCodes = new Set(existing.map((lead) => lead.trackingCode));

      const enriched = batch.map((lead) =>
        this.mapKommoLeadRow(
          lead,
          contactMap,
          pipelineMap,
          userMap,
          talkMap,
          responseMap,
        ),
      );

      const rows = enriched.filter(
        (row) => !existingCodes.has(row.trackingCode),
      );

      if (rows.length > 0) {
        await this.prisma.leadCapture.createMany({
          data: rows,
          skipDuplicates: true,
        });
        saved += rows.length;
      }

      const updates = enriched.filter((row) =>
        existingCodes.has(row.trackingCode),
      );
      for (let j = 0; j < updates.length; j += 50) {
        const updateBatch = updates.slice(j, j + 50);
        await Promise.all(
          updateBatch.map((row) =>
            this.prisma.leadCapture.update({
              where: { trackingCode: row.trackingCode },
              data: {
                fullName: row.fullName,
                phone: row.phone,
                source: row.source,
                intent: row.intent,
                status: row.status,
                workflowStatus: row.workflowStatus,
                wonAt: row.wonAt,
                lostAt: row.lostAt,
                kommoLeadId: row.kommoLeadId,
                kommoResponsibleUserId: row.kommoResponsibleUserId,
                kommoResponsibleUserName: row.kommoResponsibleUserName,
                kommoPipelineId: row.kommoPipelineId,
                kommoPipelineName: row.kommoPipelineName,
                kommoStatusId: row.kommoStatusId,
                kommoStatusName: row.kommoStatusName,
                kommoSourceName: row.kommoSourceName,
                kommoTags: row.kommoTags,
                kommoTalkStatus: row.kommoTalkStatus,
                kommoTalkOrigin: row.kommoTalkOrigin,
                kommoTalkIsRead: row.kommoTalkIsRead,
                kommoTalkIsInWork: row.kommoTalkIsInWork,
                kommoFirstResponseSec: row.kommoFirstResponseSec,
              },
            }),
          ),
        );
        updated += updateBatch.length;
      }
    }

    this.logger.log(
      `[Kommo Save] Saved ${saved} new leads, updated ${updated} existing leads`,
    );
    return saved;
  }

  private mapKommoLeadRow(
    lead: any,
    contactMap: Map<string, any>,
    pipelineMap: Map<number, any>,
    userMap: Map<number, any>,
    talkMap: Map<number, any>,
    responseMap: Map<number, number>,
  ) {
    let contact: any | null = null;
    const embeddedContacts = lead._embedded?.contacts ?? [];
    if (embeddedContacts.length > 0) {
      contact = contactMap.get(String(embeddedContacts[0].id));
    }

    const pipeline = pipelineMap.get(Number(lead.pipeline_id));
    const status = pipeline?.statusMap?.get(Number(lead.status_id));
    const user = userMap.get(Number(lead.responsible_user_id));
    const talk = talkMap.get(Number(lead.id));
    const workflowStatus = this.mapKommoWorkflowStatus(lead, status?.name);
    const closedAt = this.fromKommoTimestamp(lead.closed_at);

    return {
      trackingCode: `KM${lead.id}`,
      fullName: lead.name || contact?.name || null,
      phone: this.extractPhoneFromLead(lead, contact),
      source: this.detectSource(lead, status?.name, pipeline?.name),
      intent: lead.name || null,
      status:
        workflowStatus === 'WON_DEAL'
          ? ('CONVERTED' as LeadStatus)
          : ('PENDING' as LeadStatus),
      workflowStatus,
      createdAt: this.fromKommoTimestamp(lead.created_at) || new Date(),
      wonAt: workflowStatus === 'WON_DEAL' ? closedAt || new Date() : null,
      lostAt: workflowStatus === 'LOST' ? closedAt || new Date() : null,
      kommoLeadId: Number(lead.id) || null,
      kommoResponsibleUserId: Number(lead.responsible_user_id) || null,
      kommoResponsibleUserName: user?.name || null,
      kommoPipelineId: Number(lead.pipeline_id) || null,
      kommoPipelineName: pipeline?.name || null,
      kommoStatusId: Number(lead.status_id) || null,
      kommoStatusName: status?.name || null,
      kommoSourceName: this.extractKommoSourceName(lead, status?.name),
      kommoTags: this.extractKommoTags(lead),
      kommoTalkStatus: talk?.status || null,
      kommoTalkOrigin: talk?.origin || null,
      kommoTalkIsRead: typeof talk?.is_read === 'boolean' ? talk.is_read : null,
      kommoTalkIsInWork:
        typeof talk?.is_in_work === 'boolean' ? talk.is_in_work : null,
      kommoFirstResponseSec: responseMap.get(Number(lead.id)) ?? null,
    };
  }

  private buildPipelineMap(pipelines: any[]) {
    const map = new Map<number, any>();
    for (const pipeline of pipelines) {
      const statusMap = new Map<number, any>();
      for (const status of pipeline?._embedded?.statuses ?? []) {
        statusMap.set(Number(status.id), status);
      }
      map.set(Number(pipeline.id), { ...pipeline, statusMap });
    }
    return map;
  }

  private buildTalkMap(talks: any[]) {
    const map = new Map<number, any>();
    for (const talk of talks) {
      if (talk.entity_type !== 'lead' || !talk.entity_id) continue;
      const current = map.get(Number(talk.entity_id));
      if (
        !current ||
        Number(talk.updated_at || 0) > Number(current.updated_at || 0)
      ) {
        map.set(Number(talk.entity_id), talk);
      }
    }
    return map;
  }

  private buildFirstResponseMap(events: any[]) {
    const map = new Map<number, number>();
    const grouped = new Map<number, any[]>();
    for (const event of events) {
      if (event.entity_type !== 'lead' || !event.entity_id) continue;
      const key = Number(event.entity_id);
      const list = grouped.get(key) ?? [];
      list.push(event);
      grouped.set(key, list);
    }

    for (const [leadId, leadEvents] of grouped.entries()) {
      const sorted = leadEvents.sort(
        (a, b) => Number(a.created_at || 0) - Number(b.created_at || 0),
      );
      let incomingAt: number | null = null;
      for (const event of sorted) {
        if (event.type === 'incoming_chat_message' && incomingAt == null) {
          incomingAt = Number(event.created_at);
        }
        if (event.type === 'outgoing_chat_message' && incomingAt != null) {
          const diff = Number(event.created_at) - incomingAt;
          if (diff >= 0) map.set(leadId, diff);
          break;
        }
      }
    }
    return map;
  }

  private extractPhoneFromLead(lead: any, contact: any): string | null {
    if (contact) {
      if (contact.custom_fields_values) {
        for (const field of contact.custom_fields_values) {
          const fname = (field.field_name || '').toLowerCase();
          if (
            fname.includes('phone') ||
            fname.includes('hp') ||
            fname.includes('wa')
          ) {
            const val = field.values?.[0]?.value;
            if (val) return String(val);
          }
        }
      }
      if (contact.phone) return String(contact.phone);
    }
    return null;
  }

  private detectSource(
    lead: any,
    statusName?: string,
    pipelineName?: string,
  ): LeadSource | null {
    if (lead.custom_fields_values) {
      for (const field of lead.custom_fields_values) {
        const fname = (field.field_name || '').toLowerCase();
        if (fname.includes('source') || fname.includes('utm')) {
          const val = field.values?.[0]?.value;
          const source = this.mapLeadSource(String(val));
          if (source) return source;
        }
      }
    }
    const embeddedSource =
      lead._embedded?.source?.external_id ||
      lead._embedded?.source?.type ||
      lead._embedded?.source?.name;
    if (embeddedSource) return this.mapLeadSource(String(embeddedSource));
    const fromStatus = this.mapLeadSource(
      [statusName, pipelineName, this.extractKommoTags(lead)]
        .filter(Boolean)
        .join(' '),
    );
    if (fromStatus) return fromStatus;
    return null;
  }

  private mapLeadSource(value: string): LeadSource | null {
    const normalized = value.toLowerCase();
    if (normalized.includes('instagram') || normalized.includes('ig'))
      return 'INSTAGRAM';
    if (normalized.includes('tiktok')) return 'TIKTOK';
    if (normalized.includes('linktree') || normalized.includes('link tree'))
      return 'LINKTREE';
    if (normalized.includes('google')) return 'GOOGLE';
    if (normalized.includes('website') || normalized.includes('web'))
      return 'WEBSITE';
    if (normalized.includes('referral')) return 'REFERRAL';
    if (normalized.includes('direct')) return 'DIRECT';
    if (normalized.includes('offline')) return 'OFFLINE';
    return null;
  }

  private mapKommoWorkflowStatus(
    lead: any,
    resolvedStatusName?: string,
  ): WorkflowStatus {
    if (lead.closed_at && lead.status_id === 142) return 'WON_DEAL';
    if (lead.closed_at && lead.loss_reason_id) return 'LOST';
    const statusName = String(
      resolvedStatusName ||
        lead._embedded?.status?.name ||
        lead.status_name ||
        '',
    ).toLowerCase();
    if (statusName.includes('won') || statusName.includes('deal'))
      return 'WON_DEAL';
    if (statusName.includes('lost') || statusName.includes('reject'))
      return 'LOST';
    if (statusName.includes('sample') || statusName.includes('smaple'))
      return 'SAMPLE_REQUESTED';
    if (statusName.includes('follow') || statusName.includes('fu '))
      return 'FOLLOW_UP_1';
    if (statusName.includes('hot')) return 'NEGOTIATION';
    if (statusName.includes('warm')) return 'FOLLOW_UP_2';
    if (statusName.includes('cold')) return 'NEW_LEAD';
    if (statusName.includes('negotiation') || statusName.includes('nego'))
      return 'NEGOTIATION';
    if (statusName.includes('contact') || statusName.includes('traffic'))
      return 'CONTACTED';
    return 'NEW_LEAD';
  }

  private extractKommoSourceName(
    lead: any,
    statusName?: string,
  ): string | null {
    const source =
      lead._embedded?.source?.name ||
      lead._embedded?.source?.type ||
      lead._embedded?.source?.external_id;
    const raw = [source, statusName, this.extractKommoTags(lead)]
      .filter(Boolean)
      .join(' ');
    const normalized = raw.toLowerCase();
    if (normalized.includes('link tree') || normalized.includes('linktree'))
      return 'Linktree';
    if (normalized.includes('tiktok') || normalized.includes('tik tok'))
      return 'TikTok';
    if (normalized.includes('meta')) return 'Meta Ads';
    if (
      normalized.includes('instagram') ||
      normalized.includes('ig/fb') ||
      normalized.includes(' dm')
    )
      return 'Instagram DM';
    if (normalized.includes('google')) return 'Google';
    if (
      normalized.includes('sales smaple') ||
      normalized.includes('sales sample') ||
      normalized.includes('sample')
    )
      return 'Sales Sample';
    if (normalized.includes('webinar')) return 'Webinar';
    if (normalized.includes('webform') || normalized.includes('website'))
      return 'Website';
    return source ? String(source) : null;
  }

  private extractKommoTags(lead: any): string | null {
    const tags = lead._embedded?.tags ?? [];
    const names = tags.map((tag: any) => tag?.name).filter(Boolean);
    return names.length ? names.join(', ') : null;
  }

  private fromKommoTimestamp(value: unknown): Date | null {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
    return new Date(timestamp * 1000);
  }

  async bulkImportLeads(
    leads: {
      date?: string;
      name?: string;
      phone?: string;
      source?: string;
      intent?: string;
    }[],
  ): Promise<number> {
    let imported = 0;
    for (const item of leads) {
      if (!item.phone && !item.name) continue;
      const trackingCode = `CSV${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      await this.prisma.leadCapture.create({
        data: {
          trackingCode,
          fullName: item.name || null,
          phone: item.phone?.replace(/[^0-9]/g, '') || null,
          source: (item.source as LeadSource) || null,
          intent: item.intent || null,
          status: 'PENDING',
          workflowStatus: 'NEW_LEAD',
        },
      });
      imported++;
    }
    this.logger.log(`[CSV Import] Imported ${imported} leads`);
    return imported;
  }

  async updateLeadFromKommo(phone: string, name: string) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    const variants = [
      cleaned,
      '62' + cleaned.replace(/^0?62?/, ''),
      '0' + cleaned.replace(/^0?62?/, ''),
    ];

    const lead = await this.prisma.leadCapture.findFirst({
      where: {
        OR: variants.map((p) => ({ phone: { contains: p.slice(-10) } })),
        waProfileName: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lead) {
      this.logger.warn(
        `[Kommo] No lead found for phone: ${phone} (cleaned: ${cleaned})`,
      );
      return null;
    }

    const updated = await this.prisma.leadCapture.update({
      where: { id: lead.id },
      data: {
        waProfileName: name,
        fullName: lead.fullName || name,
      },
    });

    this.logger.log(
      `[Kommo] Updated lead ${lead.trackingCode} with name: ${name}`,
    );
    return updated;
  }
}

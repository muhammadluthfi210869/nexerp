// Leads service — OmniCRM MVP.
// Manages CrmLead (kanban inbox entry) with stage-machine guard, audit log,
// and integration to existing LeadMessage for chat timeline.

import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma/prisma.service";
import { CrmStage, type CrmLead } from "@prisma/client";

/**
 * Frozen stage machine (see docs/marketing/PHASE-0-OMNICRM-CONTRACT.md §5).
 * No backward transitions from loss stages (JUNK_LEADS, CLOSED_LOST).
 */
const STAGE_TRANSITIONS: Record<CrmStage, ReadonlyArray<CrmStage>> = {
  LEADS_MASUK: ["COLD", "JUNK_LEADS"],
  COLD: ["WARM", "JUNK_LEADS", "CLOSED_LOST"],
  WARM: ["HOT", "SAMPLE", "COLD", "CLOSED_LOST"],
  HOT: ["SAMPLE", "WARM", "CLOSED_LOST"],
  SAMPLE: ["HOT", "WARM", "CLIENT_DEAL", "CLOSED_LOST"],
  JUNK_LEADS: [],
  CLIENT_DEAL: [],
  CLOSED_LOST: [],
};

export interface ListFilter {
  stage?: CrmStage;
  assignedToId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListFilter = {}): Promise<CrmLead[]> {
    const { stage, assignedToId, limit = 50, offset = 0 } = filter;
    return this.prisma.crmLead.findMany({
      where: {
        ...(stage ? { stage } : {}),
        ...(assignedToId ? { assignedToId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      skip: Math.max(offset, 0),
    });
  }

  async getById(id: string): Promise<CrmLead> {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException(`CrmLead ${id} not found`);
    return lead;
  }

  /**
   * Stage machine update. Throws BadRequest if transition not allowed.
   * Writes LeadAudit atomically.
   */
  async updateStage(id: string, toStage: CrmStage, actorId?: string): Promise<CrmLead> {
    const existing = await this.getById(id);
    const allowed = STAGE_TRANSITIONS[existing.stage];
    if (!allowed.includes(toStage)) {
      throw new BadRequestException(
        `Illegal transition ${existing.stage} → ${toStage}. Allowed: [${allowed.join(", ") || "(none)"}]`,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.crmLead.update({
        where: { id },
        data: {
          stage: toStage,
          ...(toStage === "CLIENT_DEAL" ? { wonAt: new Date() } : {}),
          ...(toStage === "CLOSED_LOST" ? { lostAt: new Date() } : {}),
        },
      });
      await tx.leadAudit.create({
        data: {
          crmLeadId: id,
          actorId: actorId ?? null,
          action: "STAGE_CHANGE",
          fromStage: existing.stage,
          toStage,
        },
      });
      return updated;
    });
  }

  async updateDisplayName(id: string, displayName: string, actorId?: string): Promise<CrmLead> {
    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: { displayName },
    });
    await this.prisma.leadAudit.create({
      data: { crmLeadId: id, actorId: actorId ?? null, action: "DISPLAY_NAME_UPDATE" },
    });
    return updated;
  }

  async assign(id: string, assignedToId: string, actorId?: string): Promise<CrmLead> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: assignedToId } });
    if (!user) throw new NotFoundException(`User ${assignedToId} not found`);
    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: { assignedToId },
    });
    await this.prisma.leadAudit.create({
      data: { crmLeadId: id, actorId: actorId ?? null, action: "ASSIGN" },
    });
    return updated;
  }

  /**
   * Chat timeline — joins CrmLead → LeadCapture → LeadMessage.
   * Returns messages ordered chronologically.
   */
  async getMessages(id: string): Promise<Array<{
    id: string;
    direction: string;
    phone: string | null;
    waName: string | null;
    body: string;
    msgId: string | null;
    createdAt: Date;
  }>> {
    const lead = await this.getById(id);
    return this.prisma.leadMessage.findMany({
      where: { leadId: lead.leadCaptureId },
      orderBy: { createdAt: "asc" },
      select: { id: true, direction: true, phone: true, waName: true, body: true, msgId: true, createdAt: true },
    });
  }
}

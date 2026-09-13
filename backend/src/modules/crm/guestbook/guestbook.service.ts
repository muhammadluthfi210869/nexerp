// Guestbook service — Buku Tamu approval.
// See docs/marketing/PHASE-0-OMNICRM-CONTRACT.md §6 (canonical fields for GuestbookEvent).

import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { GuestbookApproval, type GuestbookEvent, type CrmLead } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma/prisma.service";

export interface GuestbookListFilter {
  status?: GuestbookApproval;
  assignedToId?: string;
  limit?: number;
  offset?: number;
}

export interface GuestbookEventWithLead extends GuestbookEvent {
  lead: Pick<CrmLead, "id" | "displayName" | "phone" | "source" | "stage" | "pageUrl" | "assignedToId">;
}

@Injectable()
export class GuestbookService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: GuestbookListFilter = {}): Promise<GuestbookEventWithLead[]> {
    const { status, assignedToId, limit = 50, offset = 0 } = filter;
    return this.prisma.guestbookEvent.findMany({
      where: {
        ...(status ? { approvalStatus: status } : {}),
        ...(assignedToId ? { lead: { assignedToId } } : {}),
      },
      include: {
        lead: {
          select: { id: true, displayName: true, phone: true, source: true, stage: true, pageUrl: true, assignedToId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      skip: Math.max(offset, 0),
    });
  }

  async getById(id: string): Promise<GuestbookEventWithLead> {
    const ev = await this.prisma.guestbookEvent.findUnique({
      where: { id },
      include: {
        lead: {
          select: { id: true, displayName: true, phone: true, source: true, stage: true, pageUrl: true, assignedToId: true },
        },
      },
    });
    if (!ev) throw new NotFoundException(`GuestbookEvent ${id} not found`);
    return ev;
  }

  /**
   * Approve or reject a Buku Tamu entry.
   * Status flip + write to LeadAudit for traceability.
   * NOTE: Ami Incoming intro WA send is wired in Phase 5 (after broadcast
   * service lands). For now the approval flips status + audit only.
   */
  async decide(id: string, approval: GuestbookApproval, actorId?: string, approverNote?: string): Promise<GuestbookEvent> {
    if (approval === GuestbookApproval.PENDING) {
      throw new BadRequestException("Use POST /crm/leads/ingest for new pending events; cannot re-pend an existing event.");
    }
    const existing = await this.prisma.guestbookEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`GuestbookEvent ${id} not found`);
    if (existing.approvalStatus !== GuestbookApproval.PENDING) {
      throw new BadRequestException(`Event already ${existing.approvalStatus.toLowerCase()}; cannot change to ${approval.toLowerCase()}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.guestbookEvent.update({
        where: { id },
        data: {
          approvalStatus: approval,
          approverId: actorId ?? null,
          approvedAt: new Date(),
          approverNote: approverNote ?? null,
        },
      });
      await tx.leadAudit.create({
        data: {
          crmLeadId: existing.crmLeadId,
          actorId: actorId ?? null,
          action: approval === GuestbookApproval.APPROVED ? "APPROVE" : "REJECT",
          metadata: { guestbookEventId: id, approverNote: approverNote ?? null },
        },
      });
      return updated;
    });
  }
}

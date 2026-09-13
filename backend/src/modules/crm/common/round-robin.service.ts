// Auto-assign busdev on lead ingest.
//
// Strategy (ponytail): pick the active BussdevStaff with the LOWEST
// totalLeads counter, increment it, and write CrmLead.assignedToId.
// Self-balancing, restart-safe, no new tables, no in-memory cursor to lose.
//
// On no active busdevs: leaves assignedToId null, logs warn, no throw —
// the lead is still created and can be assigned manually.

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma/prisma.service";

@Injectable()
export class RoundRobinService {
  private readonly logger = new Logger(RoundRobinService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign a freshly-ingested lead to the active busdev with the smallest
   * lead count. Returns the assigned busdev userId, or null if none active.
   * Idempotent at the lead level: caller should only invoke on new CrmLead.
   */
  async assignOnIngest(leadId: string): Promise<{ assignedToId: string | null }> {
    // Find the active busdev with the lowest totalLeads, tie-broken by name.
    const candidate = await this.prisma.bussdevStaff.findFirst({
      where: { isActive: true, userId: { not: null } },
      orderBy: [{ totalLeads: "asc" }, { name: "asc" }],
      select: { id: true, userId: true, name: true, totalLeads: true },
    });
    if (!candidate?.userId) {
      this.logger.warn(`No active busdev available — lead ${leadId} left unassigned`);
      return { assignedToId: null };
    }

    // Race-free increment: transaction over the staff row + the lead.
    await this.prisma.$transaction([
      this.prisma.bussdevStaff.update({
        where: { id: candidate.id },
        data: { totalLeads: { increment: 1 } },
      }),
      this.prisma.crmLead.update({
        where: { id: leadId },
        data: { assignedToId: candidate.userId },
      }),
      this.prisma.leadAudit.create({
        data: {
          crmLeadId: leadId,
          actorId: candidate.userId,
          action: "ASSIGN_AUTO",
          metadata: { via: "round-robin", bussdevStaffId: candidate.id, priorTotalLeads: candidate.totalLeads },
        },
      }),
    ]);

    this.logger.log(`Lead ${leadId} assigned to busdev ${candidate.name} (userId=${candidate.userId}, prior count=${candidate.totalLeads})`);
    return { assignedToId: candidate.userId };
  }
}
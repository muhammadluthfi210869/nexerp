// KPI service — Sales KPI tiles for /marketing/omnicrm/kpi.
// See docs/marketing/PHASE-0-OMNICRM-CONTRACT.md §6 (kpiTiles).

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma/prisma.service";
import { CrmStage } from "@prisma/client";

export interface RoundRobinRow {
  agentId: string | null;
  agentName: string | null;
  todayCount: number;
  weekCount: number;
}

export interface KpiSummary {
  leadsToday: number;
  leadsThisWeek: number;
  leadsByStage: Record<CrmStage, number>;
  avgFirstResponseMinutes: number | null;
  replyRate: number; // 0..1
  bukuTamuPending: number;
  bukuTamuApproved7d: number;
  roundRobinDistribution: RoundRobinRow[];
  generatedAt: string;
}

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<KpiSummary> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Leads today + this week
    const [leadsToday, leadsThisWeek] = await Promise.all([
      this.prisma.crmLead.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.crmLead.count({ where: { createdAt: { gte: weekStart } } }),
    ]);

    // 2. Leads by stage
    const stageRows = await this.prisma.crmLead.groupBy({
      by: ["stage"],
      _count: { _all: true },
    });
    const leadsByStage = Object.values(CrmStage).reduce(
      (acc, s) => {
        acc[s] = 0;
        return acc;
      },
      {} as Record<CrmStage, number>,
    );
    for (const row of stageRows) {
      leadsByStage[row.stage] = row._count._all;
    }

    // 3. Avg first response (minutes)
    // firstResponseAt is set when first INBOUND follows first OUTBOUND.
    // Compute on the fly by joining CrmLead → LeadMessage via leadCaptureId.
    // For MVP, return aggregate from CrmLead.firstResponseAt denormalized field.
    const responded = await this.prisma.crmLead.findMany({
      where: {
        firstResponseAt: { not: null },
        firstOutboundAt: { not: null, gte: weekStart },
      },
      select: { firstOutboundAt: true, firstResponseAt: true },
    });
    let avgFirstResponseMinutes: number | null = null;
    if (responded.length > 0) {
      const totalMinutes = responded.reduce((sum, r) => {
        const diff = (r.firstResponseAt!.getTime() - r.firstOutboundAt!.getTime()) / 60000;
        return sum + Math.max(0, diff);
      }, 0);
      avgFirstResponseMinutes = Math.round(totalMinutes / responded.length);
    }

    // 4. Reply rate (week)
    // Reply rate = (distinct leads with both OUTBOUND and INBOUND in week) /
    //              (distinct leads with OUTBOUND in week)
    // Implemented via LeadMessage queries (joined by leadCaptureId).
    const outboundLeads = await this.prisma.leadMessage.findMany({
      where: {
        direction: "OUTBOUND",
        createdAt: { gte: weekStart },
      },
      select: { leadId: true },
      distinct: ["leadId"],
    });
    const replyRate = outboundLeads.length === 0
      ? 0
      : await this.computeReplyRate(outboundLeads.map((r) => r.leadId), weekStart);

    // 5. Buku Tamu counts
    const [bukuTamuPending, bukuTamuApproved7d] = await Promise.all([
      this.prisma.guestbookEvent.count({ where: { approvalStatus: "PENDING" } }),
      this.prisma.guestbookEvent.count({
        where: { approvalStatus: "APPROVED", approvedAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // 6. Round Robin distribution (today + week). Sequential awaits so the
    // test mocks can deterministically distinguish the two queries.
    const todayByAgent = await this.prisma.crmLead.groupBy({
      by: ["assignedToId"],
      where: { createdAt: { gte: todayStart }, assignedToId: { not: null } },
      _count: { _all: true },
    });
    const weekByAgent = await this.prisma.crmLead.groupBy({
      by: ["assignedToId"],
      where: { createdAt: { gte: weekStart }, assignedToId: { not: null } },
      _count: { _all: true },
    });
    const weekMap = new Map(weekByAgent.map((r) => [r.assignedToId, r._count._all]));
    const userIds = Array.from(new Set([
      ...todayByAgent.map((r) => r.assignedToId!),
      ...weekByAgent.map((r) => r.assignedToId!),
    ]));
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));
    const roundRobinDistribution: RoundRobinRow[] = todayByAgent.map((row) => ({
      agentId: row.assignedToId,
      agentName: userMap.get(row.assignedToId!) ?? null,
      todayCount: row._count._all,
      weekCount: weekMap.get(row.assignedToId!) ?? 0,
    }));

    return {
      leadsToday,
      leadsThisWeek,
      leadsByStage,
      avgFirstResponseMinutes,
      replyRate,
      bukuTamuPending,
      bukuTamuApproved7d,
      roundRobinDistribution,
      generatedAt: now.toISOString(),
    };
  }

  /**
   * Reply rate: among leads with OUTBOUND, count those where a subsequent
   * INBOUND within 24h exists. Reuses existing LeadMessage table (which has
   * INBOUND/OUTBOUND + msgId dedup already).
   */
  private async computeReplyRate(outboundLeadCaptureIds: string[], since: Date): Promise<number> {
    if (outboundLeadCaptureIds.length === 0) return 0;
    // Get the latest OUTBOUND timestamp per lead
    const outbounds = await this.prisma.leadMessage.findMany({
      where: {
        leadId: { in: outboundLeadCaptureIds },
        direction: "OUTBOUND",
        createdAt: { gte: since },
      },
      select: { leadId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    if (outbounds.length === 0) return 0;

    const outboundByLead = new Map<string, Date[]>();
    for (const o of outbounds) {
      const arr = outboundByLead.get(o.leadId) ?? [];
      arr.push(o.createdAt);
      outboundByLead.set(o.leadId, arr);
    }

    // Find inbounds since weekStart
    const inbounds = await this.prisma.leadMessage.findMany({
      where: {
        leadId: { in: outboundLeadCaptureIds },
        direction: "INBOUND",
        createdAt: { gte: since },
      },
      select: { leadId: true, createdAt: true },
    });
    const inboundsByLead = new Map<string, Date[]>();
    for (const i of inbounds) {
      const arr = inboundsByLead.get(i.leadId) ?? [];
      arr.push(i.createdAt);
      inboundsByLead.set(i.leadId, arr);
    }

    // For each lead with outbound, check if any inbound falls within 24h after any outbound.
    let repliedCount = 0;
    for (const [leadId, outTsList] of outboundByLead) {
      const inTsList = inboundsByLead.get(leadId) ?? [];
      const hasReply = outTsList.some((outTs) =>
        inTsList.some((inTs) => {
          const diff = inTs.getTime() - outTs.getTime();
          return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
        }),
      );
      if (hasReply) repliedCount++;
    }
    return Math.round((repliedCount / outboundByLead.size) * 1000) / 1000;
  }
}

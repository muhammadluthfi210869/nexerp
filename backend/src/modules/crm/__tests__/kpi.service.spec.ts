import { KpiService } from "../kpi/kpi.service";
import { CrmStage } from "@prisma/client";

describe("KpiService", () => {
  let service: KpiService;
  const prismaMock: any = {
    crmLead: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    guestbookEvent: { count: jest.fn() },
    leadMessage: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KpiService(prismaMock);
    // Defaults: counts return 0, findMany returns []
    prismaMock.crmLead.count.mockResolvedValue(0);
    prismaMock.crmLead.groupBy.mockResolvedValue([]);
    prismaMock.crmLead.findMany.mockResolvedValue([]);
    prismaMock.guestbookEvent.count.mockResolvedValue(0);
    prismaMock.leadMessage.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);
  });

  it("returns zeros + replyRate=0 when no data", async () => {
    const kpi = await service.summary();
    expect(kpi.leadsToday).toBe(0);
    expect(kpi.leadsThisWeek).toBe(0);
    expect(kpi.replyRate).toBe(0);
    expect(kpi.avgFirstResponseMinutes).toBeNull();
    expect(kpi.bukuTamuPending).toBe(0);
    expect(kpi.bukuTamuApproved7d).toBe(0);
    expect(kpi.roundRobinDistribution).toEqual([]);
  });

  it("populates all 8 stage buckets (zero-filled when missing)", async () => {
    prismaMock.crmLead.groupBy.mockResolvedValue([{ stage: CrmStage.HOT, _count: { _all: 5 } }]);
    const kpi = await service.summary();
    expect(kpi.leadsByStage[CrmStage.HOT]).toBe(5);
    expect(kpi.leadsByStage[CrmStage.LEADS_MASUK]).toBe(0);
    expect(kpi.leadsByStage[CrmStage.CLOSED_LOST]).toBe(0);
    // All 8 stages present
    expect(Object.keys(kpi.leadsByStage).length).toBe(8);
  });

  it("computes replyRate: 1/2 leads replied within 24h = 0.5", async () => {
    // KpiService.summary makes 3 leadMessage.findMany calls in order:
    //   1. outer outbound leadIds (distinct)
    //   2. inner outbound timestamps per lead (inside computeReplyRate)
    //   3. inner inbound timestamps per lead (inside computeReplyRate)
    // lc-1 replies within 24h, lc-2 does NOT.
    prismaMock.leadMessage.findMany
      .mockResolvedValueOnce([
        { leadId: "lc-1", createdAt: new Date("2026-09-12T10:00:00Z") },
        { leadId: "lc-2", createdAt: new Date("2026-09-12T11:00:00Z") },
      ])
      .mockResolvedValueOnce([
        { leadId: "lc-1", createdAt: new Date("2026-09-12T10:00:00Z") },
        { leadId: "lc-2", createdAt: new Date("2026-09-12T11:00:00Z") },
      ])
      .mockResolvedValueOnce([
        { leadId: "lc-1", createdAt: new Date("2026-09-12T15:00:00Z") }, // 5h after OUTBOUND
      ]);

    const kpi = await service.summary();
    expect(kpi.replyRate).toBe(0.5);
  });

  it("replyRate=0 when no outbound exists (no division by zero)", async () => {
    prismaMock.leadMessage.findMany.mockResolvedValueOnce([]);
    const kpi = await service.summary();
    expect(kpi.replyRate).toBe(0);
  });

  it("replies OUTSIDE 24h window are NOT counted", async () => {
    prismaMock.leadMessage.findMany
      .mockResolvedValueOnce([
        { leadId: "lc-1", createdAt: new Date("2026-09-10T10:00:00Z") },
      ])
      .mockResolvedValueOnce([
        { leadId: "lc-1", createdAt: new Date("2026-09-10T10:00:00Z") },
      ])
      .mockResolvedValueOnce([
        // inbound 30h after outbound — outside 24h window
        { leadId: "lc-1", createdAt: new Date("2026-09-11T16:00:00Z") },
      ]);
    const kpi = await service.summary();
    expect(kpi.replyRate).toBe(0);
  });

  it("computes avg first response from firstOutboundAt/firstResponseAt diff in minutes", async () => {
    prismaMock.crmLead.findMany.mockResolvedValue([
      {
        firstOutboundAt: new Date("2026-09-12T10:00:00Z"),
        firstResponseAt: new Date("2026-09-12T10:15:00Z"), // 15 min later
      },
      {
        firstOutboundAt: new Date("2026-09-12T11:00:00Z"),
        firstResponseAt: new Date("2026-09-12T11:05:00Z"), // 5 min later
      },
    ]);
    const kpi = await service.summary();
    expect(kpi.avgFirstResponseMinutes).toBe(10); // (15+5)/2 = 10
  });

  it("avg first response = null when no responded leads", async () => {
    prismaMock.crmLead.findMany.mockResolvedValue([]);
    const kpi = await service.summary();
    expect(kpi.avgFirstResponseMinutes).toBeNull();
  });

  it("groups Round Robin distribution: today's count + week's count per agent", async () => {
    // Service makes 3 groupBy calls in this order:
    //   1. leadsByStage (returns [])
    //   2. todayByAgent (round-robin)
    //   3. weekByAgent (round-robin)
    // Use mockImplementation so the call determines which data is returned.
    prismaMock.crmLead.groupBy.mockImplementation(async (args: any) => {
      if (args?.by?.includes("stage")) return []; // leadsByStage
      if (args?.where?.createdAt?.gte && args?.where?.assignedToId) {
        // Distinguish today vs week by the exact `gte` value: todayStart is
        // an exact midnight; weekStart is 7 days before.
        const gte = args.where.createdAt.gte;
        const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        if (gte.getTime() >= todayStart.getTime()) {
          return [
            { assignedToId: "u-1", _count: { _all: 3 } },
            { assignedToId: "u-2", _count: { _all: 2 } },
          ];
        }
        return [
          { assignedToId: "u-1", _count: { _all: 10 } },
          { assignedToId: "u-2", _count: { _all: 5 } },
        ];
      }
      return [];
    });
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u-1", fullName: "Amy" },
      { id: "u-2", fullName: "Budi" },
    ]);
    const kpi = await service.summary();
    expect(kpi.roundRobinDistribution).toEqual(expect.arrayContaining([
      expect.objectContaining({ agentId: "u-1", agentName: "Amy", todayCount: 3, weekCount: 10 }),
      expect.objectContaining({ agentId: "u-2", agentName: "Budi", todayCount: 2, weekCount: 5 }),
    ]));
  });
});

// A2 — RoundRobinService.assignOnIngest (auto-assign on lead ingest).
// Closes BUG #8 (no bridge from LeadCapture round-robin to CrmLead).

import { RoundRobinService } from "../common/round-robin.service";

describe("RoundRobinService.assignOnIngest (BUG #8 fix)", () => {
  let service: RoundRobinService;
  const prismaMock: any = {
    bussdevStaff: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    crmLead: {
      update: jest.fn(),
    },
    leadAudit: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoundRobinService(prismaMock);
  });

  it("assigns to active busdev with lowest totalLeads", async () => {
    prismaMock.bussdevStaff.findFirst.mockResolvedValue({
      id: "bd-2",
      userId: "u-busdev-2",
      name: "Budi",
      totalLeads: 3,
    });
    // $transaction(array) just awaits each promise in order — the mock
    // methods already return jest.fn() promises via mockResolvedValue.
    prismaMock.$transaction.mockImplementation(async (ops: any[]) => {
      const results = [];
      for (const op of ops) results.push(await op);
      return results;
    });
    prismaMock.bussdevStaff.update.mockResolvedValue({ id: "bd-2", totalLeads: 4 });
    prismaMock.crmLead.update.mockResolvedValue({ id: "l-1", assignedToId: "u-busdev-2" });
    prismaMock.leadAudit.create.mockResolvedValue({});

    const out = await service.assignOnIngest("l-1");

    expect(out.assignedToId).toBe("u-busdev-2");
    expect(prismaMock.bussdevStaff.findFirst).toHaveBeenCalledWith({
      where: { isActive: true, userId: { not: null } },
      orderBy: [{ totalLeads: "asc" }, { name: "asc" }],
      select: { id: true, userId: true, name: true, totalLeads: true },
    });
  });

  it("writes atomic increment + assign + audit in a single transaction", async () => {
    prismaMock.bussdevStaff.findFirst.mockResolvedValue({
      id: "bd-1",
      userId: "u-1",
      name: "Amy",
      totalLeads: 0,
    });
    prismaMock.$transaction.mockImplementation(async (ops: any[]) => {
      const results = [];
      for (const op of ops) results.push(await op);
      return results;
    });
    prismaMock.bussdevStaff.update.mockResolvedValue({});
    prismaMock.crmLead.update.mockResolvedValue({});
    prismaMock.leadAudit.create.mockResolvedValue({});

    await service.assignOnIngest("l-99");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.bussdevStaff.update).toHaveBeenCalledWith({
      where: { id: "bd-1" },
      data: { totalLeads: { increment: 1 } },
    });
    expect(prismaMock.crmLead.update).toHaveBeenCalledWith({
      where: { id: "l-99" },
      data: { assignedToId: "u-1" },
    });
    expect(prismaMock.leadAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        crmLeadId: "l-99",
        actorId: "u-1",
        action: "ASSIGN_AUTO",
        metadata: expect.objectContaining({
          via: "round-robin",
          bussdevStaffId: "bd-1",
          priorTotalLeads: 0,
        }),
      }),
    });
  });

  it("returns null without throwing when no active busdev exists", async () => {
    prismaMock.bussdevStaff.findFirst.mockResolvedValue(null);

    const out = await service.assignOnIngest("l-1");

    expect(out.assignedToId).toBeNull();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("skips when candidate has null userId (data integrity safety net)", async () => {
    prismaMock.bussdevStaff.findFirst.mockResolvedValue({
      id: "bd-3",
      userId: null, // orphaned BussdevStaff with no linked user
      name: "Ghost",
      totalLeads: 0,
    });

    const out = await service.assignOnIngest("l-1");

    expect(out.assignedToId).toBeNull();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
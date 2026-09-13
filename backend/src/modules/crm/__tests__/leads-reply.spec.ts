// A1 — POST /crm/leads/:id/reply idempotency + audit + transaction.
// Closes BUG #2 (firstOutboundAt never written → KPI Avg First Response null).

import { LeadsService } from "../leads/leads.service";

describe("LeadsService.markFirstOutbound (BUG #2 fix)", () => {
  let service: LeadsService;
  const prismaMock: any = {
    crmLead: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    leadAudit: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadsService(prismaMock);
  });

  it("writes firstOutboundAt on first call and updates lastOutboundAt", async () => {
    prismaMock.crmLead.findUnique.mockResolvedValue({
      id: "l-1",
      firstOutboundAt: null,
      lastOutboundAt: null,
    });
    const updated = {
      id: "l-1",
      firstOutboundAt: new Date("2026-09-13T10:00:00Z"),
      lastOutboundAt: new Date("2026-09-13T10:00:00Z"),
    };
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        crmLead: { update: jest.fn().mockResolvedValue(updated) },
        leadAudit: { create: jest.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });

    const out = await service.markFirstOutbound("l-1", "u-busdev-1");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    // First call: firstOutboundAt AND lastOutboundAt both set
    expect(out).toEqual(updated);
  });

  it("is idempotent — second call only updates lastOutboundAt, preserves firstOutboundAt", async () => {
    const originalFirst = new Date("2026-09-13T08:00:00Z");
    prismaMock.crmLead.findUnique.mockResolvedValue({
      id: "l-1",
      firstOutboundAt: originalFirst, // already set
      lastOutboundAt: originalFirst,
    });
    let capturedUpdateData: any = null;
    const newLast = new Date("2026-09-13T11:00:00Z");
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        crmLead: {
          update: jest.fn().mockImplementation(async (args: any) => {
            capturedUpdateData = args.data;
            return { id: "l-1", firstOutboundAt: originalFirst, lastOutboundAt: newLast };
          }),
        },
        leadAudit: { create: jest.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });

    await service.markFirstOutbound("l-1", "u-busdev-1");

    // Critical: firstOutboundAt MUST NOT be in the update payload when already set
    expect(capturedUpdateData).toBeDefined();
    expect(capturedUpdateData.firstOutboundAt).toBeUndefined();
    expect(capturedUpdateData.lastOutboundAt).toBeInstanceOf(Date);
  });

  it("writes LeadAudit row with OUTBOUND_REPLY action and firstTime flag", async () => {
    prismaMock.crmLead.findUnique.mockResolvedValue({
      id: "l-1",
      firstOutboundAt: null,
    });
    let capturedAudit: any = null;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        crmLead: { update: jest.fn().mockResolvedValue({ id: "l-1" }) },
        leadAudit: {
          create: jest.fn().mockImplementation(async (args: any) => {
            capturedAudit = args.data;
            return {};
          }),
        },
      };
      return cb(tx);
    });

    await service.markFirstOutbound("l-1", "u-busdev-1");

    expect(capturedAudit).toEqual({
      crmLeadId: "l-1",
      actorId: "u-busdev-1",
      action: "OUTBOUND_REPLY",
      metadata: { firstTime: true },
    });
  });

  it("records firstTime=false on idempotent call", async () => {
    prismaMock.crmLead.findUnique.mockResolvedValue({
      id: "l-1",
      firstOutboundAt: new Date("2026-09-13T08:00:00Z"),
    });
    let capturedAudit: any = null;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        crmLead: { update: jest.fn().mockResolvedValue({ id: "l-1" }) },
        leadAudit: {
          create: jest.fn().mockImplementation(async (args: any) => {
            capturedAudit = args.data;
            return {};
          }),
        },
      };
      return cb(tx);
    });

    await service.markFirstOutbound("l-1", "u-busdev-1");

    expect(capturedAudit.metadata.firstTime).toBe(false);
  });

  it("throws NotFoundException when lead does not exist", async () => {
    prismaMock.crmLead.findUnique.mockResolvedValue(null);
    await expect(service.markFirstOutbound("missing", "u-1"))
      .rejects.toThrow(/CrmLead missing not found/);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("works without actorId (system-triggered reply)", async () => {
    prismaMock.crmLead.findUnique.mockResolvedValue({
      id: "l-1",
      firstOutboundAt: null,
    });
    let capturedAudit: any = null;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        crmLead: { update: jest.fn().mockResolvedValue({ id: "l-1" }) },
        leadAudit: {
          create: jest.fn().mockImplementation(async (args: any) => {
            capturedAudit = args.data;
            return {};
          }),
        },
      };
      return cb(tx);
    });

    await service.markFirstOutbound("l-1");

    expect(capturedAudit.actorId).toBeNull();
  });
});
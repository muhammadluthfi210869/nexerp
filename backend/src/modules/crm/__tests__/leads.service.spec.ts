import { LeadsService, ListFilter } from "../leads/leads.service";
import { CrmStage } from "@prisma/client";

describe("LeadsService", () => {
  let service: LeadsService;
  const prismaMock: any = {
    crmLead: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    leadAudit: { create: jest.fn() },
    leadMessage: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadsService(prismaMock);
  });

  describe("applyRbacScope", () => {
    it("forces assignedToId for DIGIMAR users", () => {
      const out = service.applyRbacScope(
        { stage: CrmStage.HOT },
        { id: "u-1", roles: ["DIGIMAR"] },
      );
      expect(out).toEqual({ stage: CrmStage.HOT, assignedToId: "u-1" });
    });

    it("does NOT force assignedToId if user has elevated role", () => {
      const out = service.applyRbacScope(
        { stage: CrmStage.HOT },
        { id: "u-1", roles: ["DIGIMAR", "MARKETING"] },
      );
      expect(out.assignedToId).toBeUndefined();
    });

    it("passes through for SUPER_ADMIN", () => {
      const out = service.applyRbacScope(
        { assignedToId: "other" },
        { id: "u-1", roles: ["SUPER_ADMIN"] },
      );
      expect(out).toEqual({ assignedToId: "other" });
    });

    it("returns filter unchanged when no user", () => {
      const filter: ListFilter = { stage: CrmStage.WARM };
      expect(service.applyRbacScope(filter, undefined)).toEqual(filter);
    });
  });

  describe("list", () => {
    it("applies from/to as inclusive day boundaries", async () => {
      prismaMock.crmLead.findMany.mockResolvedValue([]);
      await service.list({ from: "2026-09-12", to: "2026-09-12" });
      const arg = prismaMock.crmLead.findMany.mock.calls[0][0];
      expect(arg.where.createdAt.gte.toISOString()).toBe("2026-09-12T00:00:00.000Z");
      expect(arg.where.createdAt.lte.toISOString()).toBe("2026-09-12T23:59:59.999Z");
    });

    it("caps limit at 200", async () => {
      prismaMock.crmLead.findMany.mockResolvedValue([]);
      await service.list({ limit: 9999 });
      const arg = prismaMock.crmLead.findMany.mock.calls[0][0];
      expect(arg.take).toBe(200);
    });
  });

  describe("updateStage — stage machine guard", () => {
    it("rejects backward transition from JUNK_LEADS", async () => {
      prismaMock.crmLead.findUnique.mockResolvedValue({ id: "l-1", stage: CrmStage.JUNK_LEADS });
      await expect(service.updateStage("l-1", CrmStage.LEADS_MASUK, "u-1"))
        .rejects.toThrow(/Illegal transition JUNK_LEADS → LEADS_MASUK/);
    });

    it("rejects transitions out of loss stages", async () => {
      prismaMock.crmLead.findUnique.mockResolvedValue({ id: "l-1", stage: CrmStage.CLOSED_LOST });
      await expect(service.updateStage("l-1", CrmStage.WARM, "u-1"))
        .rejects.toThrow(/Illegal transition/);
    });

    it("rejects CLIENT_DEAL outbound", async () => {
      prismaMock.crmLead.findUnique.mockResolvedValue({ id: "l-1", stage: CrmStage.CLIENT_DEAL });
      await expect(service.updateStage("l-1", CrmStage.WARM, "u-1"))
        .rejects.toThrow(/Illegal transition/);
    });

    it("accepts COLD → WARM and writes LeadAudit in same transaction", async () => {
      prismaMock.crmLead.findUnique.mockResolvedValue({ id: "l-1", stage: CrmStage.COLD });
      const updated = { id: "l-1", stage: CrmStage.WARM, firstOutboundAt: null, wonAt: null, lostAt: null };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb({
        crmLead: { update: jest.fn().mockResolvedValue(updated) },
        leadAudit: { create: jest.fn().mockResolvedValue({}) },
      }));
      await service.updateStage("l-1", CrmStage.WARM, "u-1");
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it("sets wonAt on CLIENT_DEAL transition", async () => {
      prismaMock.crmLead.findUnique.mockResolvedValue({ id: "l-1", stage: CrmStage.SAMPLE });
      const updated = { id: "l-1", stage: CrmStage.CLIENT_DEAL, firstOutboundAt: null };
      let capturedArgs: any = null;
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          crmLead: { update: jest.fn().mockImplementation(async (args: any) => {
            capturedArgs = args; return { ...updated, ...args.data };
          }) },
          leadAudit: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });
      await service.updateStage("l-1", CrmStage.CLIENT_DEAL, "u-1");
      expect(capturedArgs.data.wonAt).toBeInstanceOf(Date);
    });
  });

  describe("updateDisplayName", () => {
    it("updates and writes LeadAudit", async () => {
      prismaMock.crmLead.update.mockResolvedValue({ id: "l-1", displayName: "Budi" });
      prismaMock.leadAudit.create.mockResolvedValue({});
      await service.updateDisplayName("l-1", "Budi", "u-1");
      expect(prismaMock.crmLead.update).toHaveBeenCalledWith({
        where: { id: "l-1" },
        data: { displayName: "Budi" },
      });
      expect(prismaMock.leadAudit.create).toHaveBeenCalledWith({
        data: { crmLeadId: "l-1", actorId: "u-1", action: "DISPLAY_NAME_UPDATE" },
      });
    });
  });

  describe("assign", () => {
    it("throws NotFound if user missing", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.assign("l-1", "u-x", "u-1")).rejects.toThrow(/User u-x not found/);
    });

    it("updates assignedToId and writes LeadAudit", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "u-2", fullName: "Amy" });
      prismaMock.crmLead.update.mockResolvedValue({ id: "l-1", assignedToId: "u-2" });
      prismaMock.leadAudit.create.mockResolvedValue({});
      await service.assign("l-1", "u-2", "u-1");
      expect(prismaMock.leadAudit.create).toHaveBeenCalledWith({
        data: { crmLeadId: "l-1", actorId: "u-1", action: "ASSIGN" },
      });
    });
  });

  describe("getMessages", () => {
    it("joins via leadCaptureId", async () => {
      prismaMock.crmLead.findUnique.mockResolvedValue({ id: "l-1", leadCaptureId: "lc-1" });
      prismaMock.leadMessage.findMany.mockResolvedValue([]);
      await service.getMessages("l-1");
      expect(prismaMock.leadMessage.findMany).toHaveBeenCalledWith({
        where: { leadId: "lc-1" },
        orderBy: { createdAt: "asc" },
        select: expect.objectContaining({
          id: true, direction: true, phone: true, waName: true, body: true, msgId: true, createdAt: true,
        }),
      });
    });
  });
});

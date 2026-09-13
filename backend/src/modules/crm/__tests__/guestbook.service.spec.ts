import { GuestbookService } from "../guestbook/guestbook.service";
import { GuestbookApproval } from "@prisma/client";

describe("GuestbookService", () => {
  let service: GuestbookService;
  const prismaMock: any = {
    guestbookEvent: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    leadAudit: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GuestbookService(prismaMock);
  });

  describe("list", () => {
    it("filters by status when provided", async () => {
      prismaMock.guestbookEvent.findMany.mockResolvedValue([]);
      await service.list({ status: GuestbookApproval.PENDING });
      const arg = prismaMock.guestbookEvent.findMany.mock.calls[0][0];
      expect(arg.where.approvalStatus).toBe(GuestbookApproval.PENDING);
    });

    it("includes lead projection with id, displayName, phone, source, stage, pageUrl, assignedToId", async () => {
      // B1: assignedToId added so the Buku Tamu UI can render the busdev
      // and apply per-busdev filter via the lead relation.
      prismaMock.guestbookEvent.findMany.mockResolvedValue([]);
      await service.list();
      const arg = prismaMock.guestbookEvent.findMany.mock.calls[0][0];
      expect(arg.include.lead.select).toEqual({
        id: true, displayName: true, phone: true, source: true, stage: true, pageUrl: true, assignedToId: true,
      });
    });
  });

  describe("decide", () => {
    it("rejects PENDING (cannot re-pend)", async () => {
      await expect(service.decide("e-1", GuestbookApproval.PENDING, "u-1"))
        .rejects.toThrow(/Use POST \/crm\/leads\/ingest/);
    });

    it("throws NotFound if event missing", async () => {
      prismaMock.guestbookEvent.findUnique.mockResolvedValue(null);
      await expect(service.decide("e-1", GuestbookApproval.APPROVED, "u-1"))
        .rejects.toThrow(/GuestbookEvent e-1 not found/);
    });

    it("rejects re-decide of already-decided event", async () => {
      prismaMock.guestbookEvent.findUnique.mockResolvedValue({
        id: "e-1", approvalStatus: GuestbookApproval.APPROVED, crmLeadId: "l-1",
      });
      await expect(service.decide("e-1", GuestbookApproval.REJECTED, "u-1"))
        .rejects.toThrow(/Event already approved/);
    });

    it("approves PENDING → APPROVED + writes LeadAudit atomically", async () => {
      prismaMock.guestbookEvent.findUnique.mockResolvedValue({
        id: "e-1", approvalStatus: GuestbookApproval.PENDING, crmLeadId: "l-1",
      });
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb({
        guestbookEvent: { update: jest.fn().mockResolvedValue({ id: "e-1", approvalStatus: GuestbookApproval.APPROVED }) },
        leadAudit: { create: jest.fn().mockResolvedValue({}) },
      }));
      await service.decide("e-1", GuestbookApproval.APPROVED, "u-1", "looks legit");
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});

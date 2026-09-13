import { HttpException } from "@nestjs/common";
import { LeadSource } from "@prisma/client";
import { LeadSvcWebhookController } from "../ingest/lead-svc-webhook.controller";
import { computeHmac } from "../common/hmac";

/**
 * Wave 1 / A4 — HMAC enforcement test for the lead-svc webhook.
 * Covers: valid signature (201 path), invalid signature (401), missing env (401).
 * HMAC unit mechanics are tested separately in hmac.spec.ts.
 */
describe("LeadSvcWebhookController — HMAC enforcement", () => {
  const SECRET = "test-secret-32-chars-long-padding";
  const NOW_MS = 1_700_000_000_000;
  const NOW_SEC = NOW_MS / 1000;
  const OLD_ENV = process.env.LEAD_SVC_INGEST_SECRET;

  const body = {
    leadCaptureId: "550e8400-e29b-41d4-a716-446655440000",
    phone: "081234567890",
    source: LeadSource.WEBSITE,
  };
  const bodyJson = JSON.stringify(body);

  function makeController(prismaMock: any, roundRobin: any = { assignOnIngest: jest.fn().mockResolvedValue({ assignedToId: "u-busdev-1" }) }): LeadSvcWebhookController {
    return new LeadSvcWebhookController(prismaMock, roundRobin);
  }

  function makePrismaMock(returnValue: any = { lead: { id: "L1", assignedToId: null }, guestbookEvent: { id: "G1" } }) {
    return {
      $transaction: jest.fn(async (fn: any) =>
        fn({
          crmLead: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: "L1", leadCaptureId: body.leadCaptureId, assignedToId: null }),
          },
          leadAudit: { create: jest.fn().mockResolvedValue({}) },
          guestbookEvent: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: "G1" }),
          },
        }),
      ),
      crmLead: {
        findUnique: jest.fn().mockResolvedValue({ id: "L1", leadCaptureId: body.leadCaptureId, assignedToId: "u-busdev-1" }),
      },
    };
  }

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW_MS);
  });
  afterEach(() => {
    jest.useRealTimers();
    if (OLD_ENV === undefined) delete process.env.LEAD_SVC_INGEST_SECRET;
    else process.env.LEAD_SVC_INGEST_SECRET = OLD_ENV;
  });

  it("accepts a valid signature and reaches the prisma layer", async () => {
    process.env.LEAD_SVC_INGEST_SECRET = SECRET;
    const sig = computeHmac(SECRET, NOW_SEC, bodyJson);
    const prisma = makePrismaMock();
    const ctrl = makeController(prisma);

    const result = await ctrl.ingest(body as any, sig, String(NOW_SEC));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.lead.id).toBe("L1");
    expect(result.guestbookEvent.id).toBe("G1");
  });

  it("rejects an invalid signature with HTTP 401", async () => {
    process.env.LEAD_SVC_INGEST_SECRET = SECRET;
    const badSig = computeHmac("wrong-secret", NOW_SEC, bodyJson);
    const prisma = makePrismaMock();
    const ctrl = makeController(prisma);

    await expect(ctrl.ingest(body as any, badSig, String(NOW_SEC)))
      .rejects.toMatchObject({ status: 401 });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects when LEAD_SVC_INGEST_SECRET is missing with HTTP 401", async () => {
    delete process.env.LEAD_SVC_INGEST_SECRET;
    const sig = computeHmac(SECRET, NOW_SEC, bodyJson);
    const prisma = makePrismaMock();
    const ctrl = makeController(prisma);

    await expect(ctrl.ingest(body as any, sig, String(NOW_SEC)))
      .rejects.toBeInstanceOf(HttpException);

    const err: HttpException = await ctrl.ingest(body as any, sig, String(NOW_SEC)).catch((e) => e);
    expect(err.getStatus()).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
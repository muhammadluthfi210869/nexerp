// Lead-svc ingest webhook — HMAC-signed entry point from dreamlab.id.
// See docs/marketing/PHASE-0-OMNICRM-CONTRACT.md §6 (ingest).
//
// Dreamlab-side (lead-svc-deploy/server.mjs) calls this after
// `assign_and_insert_lead` RPC succeeds. HMAC is sha256(secret, ts.rawBody).
// On 201 we create CrmLead (LEADS_MASUK) + GuestbookEvent (PENDING) atomically.
// If CrmLead already exists for the leadCaptureId, idempotent (skip creation,
// just ensure GuestbookEvent exists).

import {
  Controller, Post, Body, Headers, HttpCode, HttpException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createHash } from "crypto";
import { LeadSource, type CrmLead, type GuestbookEvent } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma/prisma.service";
import { validateHmac } from "../common/hmac";
import { LeadIngestDto } from "../dto/lead-ingest.dto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Convert any trackingCode-shaped input to a stable UUID. The dreamlab.id
 * website sends trackingCode (e.g. "LC-abc123") rather than a UUID.
 * Hashing gives us idempotent linking without requiring schema changes.
 */
function toStableUuid(value: string): string {
  if (UUID_RE.test(value)) return value.toLowerCase();
  const hex = createHash("sha256").update(`nexerp-crm:${value}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

@ApiTags("crm-ingest")
@Controller(["crm", "v1/crm"])
export class LeadSvcWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /crm/leads/ingest
   * Body: LeadIngestDto (raw, exactly as received)
   * Headers: X-Dreamlab-Signature, X-Dreamlab-Timestamp
   *
   * Note: this controller is NOT guarded by JwtAuthGuard — it's authenticated
   * via HMAC instead. RolesGuard is intentionally absent.
   */
  @Post("leads/ingest")
  @HttpCode(201)
  async ingest(
    @Body() rawBody: LeadIngestDto,
    @Headers("x-dreamlab-signature") signature: string | undefined,
    @Headers("x-dreamlab-timestamp") timestamp: string | undefined,
  ): Promise<{ lead: CrmLead; guestbookEvent: GuestbookEvent }> {
    const secret = process.env.LEAD_SVC_INGEST_SECRET ?? "";
    // 401 (not 503) per Wave 1 A4 hardening: do not leak server-config state.
    if (!secret) {
      throw new HttpException("Server not configured for lead-svc ingest", 401);
    }
    const validation = validateHmac(
      { signature, timestamp },
      secret,
      JSON.stringify(rawBody),
    );
    if (!validation.valid) {
      throw new HttpException(`Invalid HMAC: ${validation.reason}`, 401);
    }

    const leadCaptureId = toStableUuid(rawBody.leadCaptureId);

    // Idempotency: if CrmLead already exists for this leadCaptureId, just
    // ensure GuestbookEvent exists; otherwise create both atomically.
    return this.prisma.$transaction(async (tx) => {
      let lead = await tx.crmLead.findUnique({
        where: { leadCaptureId },
      });
      if (!lead) {
        lead = await tx.crmLead.create({
          data: {
            leadCaptureId,
            trackingCode: rawBody.trackingCode ?? null,
            phone: rawBody.phone,
            source: rawBody.source ?? LeadSource.WEBSITE,
            pageUrl: rawBody.pageUrl ?? null,
            pageTitle: rawBody.pageTitle ?? null,
            referrer: rawBody.referrer ?? null,
            intent: rawBody.intent ?? null,
            deviceType: rawBody.deviceType ?? null,
            browser: rawBody.browser ?? null,
            displayName: rawBody.displayName ?? null,
          },
        });
        await tx.leadAudit.create({
          data: { crmLeadId: lead.id, action: "INGEST", metadata: { source: rawBody.source, trackingCode: rawBody.trackingCode ?? null } },
        });
      }

      let event = await tx.guestbookEvent.findUnique({
        where: { crmLeadId: lead.id },
      });
      if (!event) {
        event = await tx.guestbookEvent.create({
          data: {
            crmLeadId: lead.id,
            approvalStatus: "PENDING",
            pageUrl: rawBody.pageUrl ?? "(unknown)",
            pageTitle: rawBody.pageTitle ?? null,
            referrer: rawBody.referrer ?? null,
            intent: rawBody.intent ?? null,
            source: rawBody.source ?? "WEBSITE",
          },
        });
      }
      return { lead, guestbookEvent: event };
    });
  }
}

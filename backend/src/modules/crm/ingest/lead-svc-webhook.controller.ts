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
import { LeadSource, type CrmLead, type GuestbookEvent } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma/prisma.service";
import { validateHmac } from "../common/hmac";
import { LeadIngestDto } from "../dto/lead-ingest.dto";

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
    if (!secret) {
      throw new HttpException("Server not configured for lead-svc ingest", 503);
    }
    const validation = validateHmac(
      { signature, timestamp },
      secret,
      JSON.stringify(rawBody),
    );
    if (!validation.valid) {
      throw new HttpException(`Invalid HMAC: ${validation.reason}`, 401);
    }

    // Idempotency: if CrmLead already exists for this leadCaptureId, just
    // ensure GuestbookEvent exists; otherwise create both atomically.
    return this.prisma.$transaction(async (tx) => {
      let lead = await tx.crmLead.findUnique({
        where: { leadCaptureId: rawBody.leadCaptureId },
      });
      if (!lead) {
        lead = await tx.crmLead.create({
          data: {
            leadCaptureId: rawBody.leadCaptureId,
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
          data: { crmLeadId: lead.id, action: "INGEST", metadata: { source: rawBody.source } },
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

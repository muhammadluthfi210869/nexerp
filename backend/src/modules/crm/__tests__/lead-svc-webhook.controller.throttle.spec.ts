import "reflect-metadata";
import { LeadSvcWebhookController } from "../ingest/lead-svc-webhook.controller";

const LIMIT_KEY = "THROTTLER:LIMITdefault";
const TTL_KEY = "THROTTLER:TTLdefault";

/**
 * Wave 1 / A4 — verify @Throttle contract on the ingest webhook route.
 * Runtime enforcement is NestJS's responsibility (global ThrottlerGuard).
 * Pins the limit/ttl so a future change can't silently widen the cap
 * without review.
 */
describe("LeadSvcWebhookController — ingest route throttling", () => {
  it("applies 30 requests per minute (60_000 ms) to leads/ingest", () => {
    const limit = Reflect.getMetadata(LIMIT_KEY, LeadSvcWebhookController.prototype.ingest);
    const ttl = Reflect.getMetadata(TTL_KEY, LeadSvcWebhookController.prototype.ingest);

    expect(limit).toBe(30);
    expect(ttl).toBe(60_000);
  });
});
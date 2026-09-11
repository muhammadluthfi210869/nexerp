// HMAC-SHA256 validator for inbound webhooks from dreamlab.id lead-svc-deploy.
// See docs/marketing/PHASE-0-OMNICRM-CONTRACT.md §6 (ingest).
//
// Expected headers:
//   X-Dreamlab-Signature: sha256=<hex>
//   X-Dreamlab-Timestamp: <unix seconds>
//
// Validation: timestamp must be within ±300s of server time (replay window).
//             signature = HMAC-SHA256(secret, `${timestamp}.${rawBody}`).
//
// Use `validateHmac(headers, rawBody)` from controllers — see
// `lead-svc-webhook.controller.ts`.

import * as crypto from "crypto";

export const REPLAY_WINDOW_SECONDS = 300;

export interface HmacHeaders {
  signature: string | undefined;
  timestamp: string | undefined;
}

export interface HmacValidationResult {
  valid: boolean;
  reason?: "MISSING_SIGNATURE" | "MISSING_TIMESTAMP" | "STALE_TIMESTAMP" | "INVALID_SIGNATURE";
}

export function computeHmac(secret: string, timestamp: number, rawBody: string): string {
  const payload = `${timestamp}.${rawBody}`;
  return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Constant-time comparison of two hex strings.
 * Falls back to plain === if length differs (returns false).
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Validate HMAC signature + replay window.
 * secret: LEAD_SVC_INGEST_SECRET env var.
 * rawBody: exact request body bytes (do NOT pre-parse JSON).
 */
export function validateHmac(headers: HmacHeaders, secret: string, rawBody: string, now: number = Date.now()): HmacValidationResult {
  if (!headers.signature) return { valid: false, reason: "MISSING_SIGNATURE" };
  if (!headers.timestamp) return { valid: false, reason: "MISSING_TIMESTAMP" };

  const ts = parseInt(headers.timestamp, 10);
  if (!Number.isFinite(ts)) return { valid: false, reason: "STALE_TIMESTAMP" };
  const age = Math.abs(now - ts * 1000) / 1000;
  if (age > REPLAY_WINDOW_SECONDS) return { valid: false, reason: "STALE_TIMESTAMP" };

  const expected = computeHmac(secret, ts, rawBody);
  if (!safeEqual(headers.signature, expected)) return { valid: false, reason: "INVALID_SIGNATURE" };

  return { valid: true };
}

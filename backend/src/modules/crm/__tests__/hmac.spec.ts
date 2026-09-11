import { computeHmac, validateHmac, REPLAY_WINDOW_SECONDS } from "../common/hmac";

describe("HMAC validation", () => {
  const SECRET = "test-secret-32-chars-long-padding";
  const NOW = 1_700_000_000_000; // fixed ms timestamp
  const body = JSON.stringify({ leadCaptureId: "abc", phone: "0812" });

  describe("computeHmac", () => {
    it("returns sha256=<hex> with the format spec expects", () => {
      const hmac = computeHmac(SECRET, NOW / 1000, body);
      expect(hmac).toMatch(/^sha256=[0-9a-f]{64}$/);
    });

    it("is deterministic — same input = same output", () => {
      const a = computeHmac(SECRET, NOW / 1000, body);
      const b = computeHmac(SECRET, NOW / 1000, body);
      expect(a).toBe(b);
    });

    it("differs when timestamp or body changes", () => {
      const base = computeHmac(SECRET, NOW / 1000, body);
      expect(computeHmac(SECRET, NOW / 1000 + 1, body)).not.toBe(base);
      expect(computeHmac(SECRET, NOW / 1000, body + " ")).not.toBe(base);
    });
  });

  describe("validateHmac", () => {
    const ts = String(NOW / 1000);

    it("accepts valid signature", () => {
      const sig = computeHmac(SECRET, NOW / 1000, body);
      const result = validateHmac({ signature: sig, timestamp: ts }, SECRET, body, NOW);
      expect(result.valid).toBe(true);
    });

    it("rejects missing signature (MISSING_SIGNATURE)", () => {
      const result = validateHmac({ signature: undefined, timestamp: ts }, SECRET, body, NOW);
      expect(result).toEqual({ valid: false, reason: "MISSING_SIGNATURE" });
    });

    it("rejects missing timestamp (MISSING_TIMESTAMP)", () => {
      const result = validateHmac({ signature: "sha256=abc", timestamp: undefined }, SECRET, body, NOW);
      expect(result).toEqual({ valid: false, reason: "MISSING_TIMESTAMP" });
    });

    it("rejects non-numeric timestamp (STALE_TIMESTAMP)", () => {
      const result = validateHmac({ signature: "sha256=abc", timestamp: "abc" }, SECRET, body, NOW);
      expect(result).toEqual({ valid: false, reason: "STALE_TIMESTAMP" });
    });

    it("rejects timestamps older than replay window (STALE_TIMESTAMP)", () => {
      const oldTs = (NOW - (REPLAY_WINDOW_SECONDS + 60) * 1000) / 1000;
      const sig = computeHmac(SECRET, oldTs, body);
      const result = validateHmac({ signature: sig, timestamp: String(oldTs) }, SECRET, body, NOW);
      expect(result).toEqual({ valid: false, reason: "STALE_TIMESTAMP" });
    });

    it("rejects timestamps newer than replay window (clock skew defense)", () => {
      const futureTs = (NOW + (REPLAY_WINDOW_SECONDS + 60) * 1000) / 1000;
      const sig = computeHmac(SECRET, futureTs, body);
      const result = validateHmac({ signature: sig, timestamp: String(futureTs) }, SECRET, body, NOW);
      expect(result).toEqual({ valid: false, reason: "STALE_TIMESTAMP" });
    });

    it("rejects wrong signature (INVALID_SIGNATURE)", () => {
      const sig = computeHmac("wrong-secret", NOW / 1000, body);
      const result = validateHmac({ signature: sig, timestamp: ts }, SECRET, body, NOW);
      expect(result).toEqual({ valid: false, reason: "INVALID_SIGNATURE" });
    });

    it("rejects tampered body", () => {
      const sig = computeHmac(SECRET, NOW / 1000, body);
      const result = validateHmac(
        { signature: sig, timestamp: ts },
        SECRET,
        body + "extra-bytes", // tampered body
        NOW,
      );
      expect(result).toEqual({ valid: false, reason: "INVALID_SIGNATURE" });
    });
  });
});

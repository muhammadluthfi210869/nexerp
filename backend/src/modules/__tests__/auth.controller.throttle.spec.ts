import "reflect-metadata";
import { AuthController } from "../auth/auth.controller";

// @Throttle decorator stores metadata under "THROTTLER:LIMIT<name>" /
// "THROTTLER:TTL<name>" (see @nestjs/throttler throttler.constants.js).
// Constants are not re-exported from the package entry; pin the strings.
const LIMIT_KEY = "THROTTLER:LIMITdefault";
const TTL_KEY = "THROTTLER:TTLdefault";

/**
 * Wave 1 / A4 — verify @Throttle contract on login route.
 * Runtime enforcement is NestJS's responsibility (global ThrottlerGuard).
 * This test pins the limit/ttl so a future change can't silently widen the
 * brute-force window without review.
 */
describe("AuthController — login route throttling", () => {
  it("applies 5 attempts per 15 minutes (900_000 ms) to login", () => {
    const limit = Reflect.getMetadata(LIMIT_KEY, AuthController.prototype.login);
    const ttl = Reflect.getMetadata(TTL_KEY, AuthController.prototype.login);

    expect(limit).toBe(5);
    expect(ttl).toBe(15 * 60 * 1000);
  });
});
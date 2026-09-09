import { Injectable } from '@nestjs/common';

export interface IdempotencyRecord {
  result: unknown;
  expiresAt: number;
}

@Injectable()
export class IdempotencyService {
  private readonly cache = new Map<string, IdempotencyRecord>();
  private readonly defaultTtlMs = 60_000; // 60 seconds

  check(
    key: string | undefined,
    endpoint: string,
  ): { result: unknown; isReplay: boolean } | null {
    if (!key) return null;
    const fullKey = `${endpoint}:${key}`;
    const cached = this.cache.get(fullKey);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(fullKey);
      return null;
    }

    return { result: cached.result, isReplay: true };
  }

  record(
    key: string | undefined,
    endpoint: string,
    result: unknown,
    ttlMs: number = this.defaultTtlMs,
  ): void {
    if (!key) return;
    const fullKey = `${endpoint}:${key}`;
    this.cache.set(fullKey, {
      result,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

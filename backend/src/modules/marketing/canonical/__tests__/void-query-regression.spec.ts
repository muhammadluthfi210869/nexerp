/**
 * Regression test for `pg_advisory_xact_lock` void query bug.
 *
 * Background (2026-09-14): Source contained a `$queryRawUnsafe('SELECT pg_advisory_xact_lock(...)')`
 * call. The Prisma Driver Adapter (since Prisma 5.x) cannot deserialize the void
 * result type, so the call threw "Failed to deserialize column of type 'void'"
 * and aborted the request when an Idempotency-Key header was provided.
 *
 * Fix: removed the advisory-lock query entirely. The DB-level unique constraint
 * on (scope, key) already prevents duplicate writes. See source comment at
 * canonical-marketing.service.ts around line 1258.
 */
import * as fs from 'fs';
import * as path from 'path';

describe('Idempotency-Key void query regression (2026-09-14)', () => {
  const servicePath = path.resolve(
    __dirname,
    '../canonical-marketing.service.ts',
  );

  it('source file does NOT contain pg_advisory_xact_lock as executable code', () => {
    const src = fs.readFileSync(servicePath, 'utf8');

    // Strip the explanatory comment block (lines that describe the prior removal)
    const stripped = src.replace(
      /\/\/[^\n]*pg_advisory_xact_lock[^\n]*\n(\s*\/\/[^\n]*\n)*/g,
      '',
    );

    // After stripping the comment, NO executable `pg_advisory_xact_lock` should remain.
    expect(stripped).not.toMatch(/pg_advisory_xact_lock/);

    // And specifically no `$queryRawUnsafe(... pg_advisory_xact_lock ...)`
    expect(stripped).not.toMatch(/\$queryRawUnsafe[^)]*pg_advisory_xact_lock/);
  });

  it('source file documents the design decision in a comment', () => {
    const src = fs.readFileSync(servicePath, 'utf8');
    expect(src).toMatch(/pg_advisory_xact_lock was previously invoked here/);
    expect(src).toMatch(/advisory lock is omitted by design/);
  });
});
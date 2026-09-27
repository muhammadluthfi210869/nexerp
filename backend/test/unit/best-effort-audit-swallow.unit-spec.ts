/**
 * Fase 3 — a best-effort write that fails must leave a trace.
 *
 * Twelve call sites in `modules/scm/services/` were written as
 *
 *   try { await tx.auditLog.create({ ... }); } catch {}
 *
 * The swallow itself is the right call: a failed audit row must not roll back the
 * business transaction, and `AuditLogInterceptor` makes exactly the same decision
 * (`platform/audit/audit.interceptor.ts` — `logger.warn`, no rethrow).
 *
 * What is not right is the silence. When the audit insert fails and nothing is
 * written anywhere, the system keeps claiming "every mutation is audited" with no
 * way to find out otherwise from the inside. Two of the twelve swallow a mirror
 * write (`Invoice` mirroring `Bill`) rather than an audit row, which is the same
 * shape: the authoritative row is already committed, the mirror is best-effort,
 * and a silent desync is indistinguishable from a clean run.
 *
 * The regression is asserted three ways, because each covers something the others
 * cannot: the helper is unit-tested, one real service is driven with a mock whose
 * audit write rejects (proving the wiring, not just the helper), and the source of
 * all five files is scanned so a new `catch {}` cannot be added later.
 */

import { Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { logBestEffort } from '../../src/common/helpers/best-effort';
import { PurchaseRequestsService } from '../../src/modules/scm/services/purchase-requests.service';

const SCM_SERVICES = [
  'purchase-requests.service.ts',
  'purchase-orders.service.ts',
  'purchase-payments.service.ts',
  'purchase-invoices.service.ts',
  'purchase-returns.service.ts',
];

describe('Fase 3 — swallowed best-effort writes are logged, not silent', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logBestEffort', () => {
    it('warns with the label and the cause, and does not rethrow', () => {
      expect(() =>
        logBestEffort(new Logger('test'), 'audit:APPayment:REVERSE', new Error('audit table down')),
      ).not.toThrow();

      expect(warn).toHaveBeenCalledTimes(1);
      const message = warn.mock.calls[0][0] as string;
      // The label is what makes the line greppable; without it a warn from here
      // is indistinguishable from any other warn in the process.
      expect(message).toContain('audit:APPayment:REVERSE');
      expect(message).toContain('audit table down');
    });

    it('survives a non-Error rejection, which is what a Prisma driver error often is', () => {
      expect(() =>
        logBestEffort(new Logger('test'), 'invoice-mirror:bill-create', 'connection reset'),
      ).not.toThrow();

      expect(warn.mock.calls[0][0] as string).toContain('connection reset');
    });
  });

  describe('a failing audit write must not fail the business call', () => {
    const buildService = () => {
      const tx = {
        purchaseRequest: {
          create: jest.fn().mockResolvedValue({ id: 'pr-1', requestNumber: 'PR-2026-0001' }),
        },
        auditLog: {
          create: jest.fn().mockRejectedValue(new Error('audit table down')),
        },
      };
      const prisma: Record<string, unknown> = {
        $transaction: jest.fn((cb: (t: unknown) => unknown) => cb(tx)),
      };
      const idGenerator = { generateId: jest.fn().mockResolvedValue('PR-2026-0001') };

      const service = new PurchaseRequestsService(
        prisma as never,
        idGenerator as never,
      );
      return { service, tx };
    };

    const dto = {
      items: [{ materialId: 'mat-1', qtyRequired: 1 }],
      warehouseId: 'wh-1',
      supplierId: 'sup-1',
    } as never;

    it('still returns the created record when the audit row fails', async () => {
      const { service, tx } = buildService();

      const result = await service.create('user-1', dto);

      // The audit write really did fail — otherwise this test proves nothing.
      expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 'pr-1' });
    });

    it('says so in the log rather than swallowing it', async () => {
      const { service } = buildService();

      await service.create('user-1', dto);

      const labels = warn.mock.calls.map((c) => String(c[0]));
      expect(labels.some((l) => l.includes('audit:PurchaseRequest:CREATE'))).toBe(true);
    });
  });

  describe('no bare catch {} left in the purchase services', () => {
    it.each(SCM_SERVICES)('%s has no empty catch block', (file) => {
      const source = readFileSync(
        join(__dirname, '..', '..', 'src', 'modules', 'scm', 'services', file),
        'utf8',
      );

      const empty = source.match(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g) ?? [];
      expect({ file, empty }).toEqual({ file, empty: [] });
    });
  });
});

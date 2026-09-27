/**
 * Fase 3B — a user-caused condition must not answer 500.
 *
 * Nineteen service-layer sites threw a bare `new Error(...)`. Everything thrown
 * from a service reaches `GlobalExceptionFilter` (`src/common/filters/global-exception.filter.ts`),
 * which maps `HttpException` to its own status but maps *any other* throwable to
 * `500 INTERNAL_SERVER_ERROR` and logs it as an "Unhandled exception".
 *
 * So "HKI Record not found" was answered as a server fault, logged as a server
 * fault, and paged whoever watches the error log — for a client typo. The caller
 * could not tell a missing row from a crashed process, because a bare `Error`
 * carries no status and no stable `code` for the frontend to switch on.
 *
 * `src/common/exceptions/api-exception.ts` already holds the vocabulary for this
 * (`ResourceNotFoundException`, `BusinessRuleViolationException`, ...), and the
 * filter reads their `code` straight into the problem-details body. Nothing new
 * is introduced here — these classes were written for exactly these call sites.
 *
 * Asserted twice: one real service is driven so the throw is observed as an
 * `HttpException` (not merely trusted), and the source of all seven files is
 * scanned so a new bare `Error` cannot be added later.
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OmniCrmStateService } from '../../src/modules/marketing/omni-crm/omni-crm-state.service';

/** Services reachable from a controller: everything here must throw HttpException. */
const HTTP_BOUNDARY_SERVICES = [
  'legality/legality.service.ts',
  'production-planning/services/production-plans.service.ts',
  'executive/executive.service.ts',
  'bussdev/bussdev.service.ts',
  'marketing/landing-tracker.service.ts',
  'marketing/omni-crm/omni-crm-state.service.ts',
  'finance/finance.service.ts',
];

const capture = async (run: () => Promise<unknown>): Promise<unknown> => {
  try {
    await run();
  } catch (err) {
    return err;
  }
  throw new Error('expected the call to reject, but it resolved');
};

describe('Fase 3B — user-caused conditions carry a status, not a 500', () => {
  describe('a stale OmniCRM version answers 409', () => {
    const buildService = () => {
      const prisma = {
        omniCrmState: {
          findUnique: jest.fn().mockResolvedValue({ ownerId: 'u1', version: 3 }),
        },
      };
      return new OmniCrmStateService(prisma as never);
    };

    it('throws an HttpException rather than a bare Error', async () => {
      const thrown = await capture(() => buildService().upsert('u1', { panels: [] }, 2));

      // The whole point: a bare Error would be answered 500 (the filter's else branch).
      expect(thrown).toBeInstanceOf(HttpException);
    });

    it('carries 409 and the VERSION_CONFLICT code the controller used to string-match', async () => {
      const thrown = (await capture(() =>
        buildService().upsert('u1', { panels: [] }, 2),
      )) as HttpException;

      expect(thrown.getStatus()).toBe(HttpStatus.CONFLICT);

      // The filter reads `code` off the response object into problem-details.
      const body = thrown.getResponse() as { code?: string };
      expect(body.code).toBe('VERSION_CONFLICT');
    });

    it('still accepts the current version', async () => {
      const prisma = {
        omniCrmState: {
          findUnique: jest.fn().mockResolvedValue({ ownerId: 'u1', version: 3 }),
          update: jest.fn().mockResolvedValue({ ownerId: 'u1', version: 4 }),
        },
      };
      const service = new OmniCrmStateService(prisma as never);

      await expect(service.upsert('u1', { panels: [] }, 3)).resolves.toMatchObject({
        version: 4,
      });
    });
  });

  describe('no bare throw new Error left at an HTTP boundary', () => {
    it.each(HTTP_BOUNDARY_SERVICES)('%s throws typed exceptions only', (file) => {
      const source = readFileSync(
        join(__dirname, '..', '..', 'src', 'modules', file),
        'utf8',
      );

      const bare = source.match(/throw new Error\(/g) ?? [];
      expect({ file, bare }).toEqual({ file, bare: [] });
    });
  });
});

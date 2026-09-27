import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load ENV from root or backend folder
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

/**
 * BUS-RULE-056, enforced at the Prisma write point instead of at one service
 * method.
 *
 * `finance.service.ts:createJournalEntry()` already asserts this for the MANUAL
 * route, but the 24 operational journal writes across 13 modules call
 * `journalEntry.create` directly and bypass it entirely. That is how
 * `commercial/services/payments.service.ts:88-94` committed a credit-only entry:
 * it resolves its debit legs by COA code `1101`/`1108`/`2102`, none of which exist
 * in the live chart of accounts, and its guard is `journalLines.length > 0` — not
 * a balance check — so the surviving credit leg posted alone.
 *
 * Fail-closed on purpose: an entry whose `lines.create` cannot be read is REFUSED,
 * not waved through. A new write shape must be taught to this guard, never
 * silently exempted from it.
 *
 * ponytail: only `create` is guarded — measured 24/24 journal writes are
 * `journalEntry.create({ lines: { create: [...] } })`, with 0 `createMany`,
 * 0 `update`/`upsert`, and 0 direct `journalLine.create`. Guard those too when one
 * first appears.
 */
const BALANCE_TOLERANCE = 0.01;

function assertJournalBalanced(args: { data?: any }): void {
  const lines = args?.data?.lines?.create;
  const rows = Array.isArray(lines) ? lines : lines ? [lines] : [];

  if (rows.length === 0) {
    throw new BadRequestException(
      'Journal entry refused: no lines. A journal with no double entry is not a journal. [JOURNAL_UNBALANCED]',
    );
  }

  const totalDebit = rows.reduce((s: number, l: any) => s + Number(l?.debit ?? 0), 0);
  const totalCredit = rows.reduce((s: number, l: any) => s + Number(l?.credit ?? 0), 0);

  // Same tolerance and same message as `finance.service.ts:174-178`, so a caller
  // matching on the [JOURNAL_UNBALANCED] marker sees one shape regardless of route.
  if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
    throw new BadRequestException(
      `Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit} [JOURNAL_UNBALANCED]`,
    );
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: process.env.NODE_ENV === 'production' ? ['error'] : [],
    });

    // One extension covers every journal write, including the ones issued through
    // `tx` inside an interactive `$transaction` — an extension on the client IS
    // inherited by the transaction callback, so all 24 sites are closed without
    // touching the 13 business files.
    const guarded = this.$extends({
      name: 'journal-balance-guard',
      query: {
        journalEntry: {
          async create({ args, query }: any) {
            assertJournalBalanced(args);
            return query(args);
          },
        },
      },
    }) as unknown as PrismaService;

    // `$extends` returns a plain extended object rather than a `PrismaService`
    // instance, so the lifecycle hooks have to be carried over by hand.
    // ponytail: safe while nothing subclasses PrismaService or checks
    // `instanceof` (measured: 0 of each). If a subclass appears, build the guard
    // in a static factory instead of returning from the constructor.
    guarded.pool = pool;
    guarded.onModuleInit = PrismaService.prototype.onModuleInit.bind(guarded);
    guarded.onModuleDestroy = PrismaService.prototype.onModuleDestroy.bind(guarded);

    return guarded;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected via Driver Adapter');
    } catch (e) {
      console.error('❌ Prisma connection failed', e);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
/**
 * COA CODE COVERAGE GATE — Fase 3b follow-up.
 *
 * WHY THIS EXISTS
 * ---------------
 * `docs/qa-gate/2026-09-25-fase3b-auto-journal-balance.md` §2.1 measured a data
 * defect that no other gate can see: 33 COA codes are referenced from
 * `backend/src`, but the live chart of accounts holds 32 rows drawn from a
 * DIFFERENT numbering regime. The balance guard added in Fase 3b turned that from
 * silent corruption into a hard refusal — fail-closed, but it means 5 write paths
 * now stop working, and one of them (`sales-invoices.service.ts:141`) skips its
 * journal silently instead of refusing.
 *
 * WHY NO OTHER GATE CATCHES IT
 * ----------------------------
 * `getTrialBalance` iterates ACCOUNTS and attaches their lines. A journal line
 * pointing at a non-existent account is therefore not merely unbalanced — it is
 * INVISIBLE. A missing code can never surface through the trial balance, so the
 * defect has to be measured here, in source, against the live DB.
 *
 * WHAT IT DOES
 * ------------
 * Resolves every referenced code in the order the services actually resolve it:
 * literal primary, then the `OR: [{code:'x'},{code:'y'}]` fallback chain.
 * A site is only covered if SOME code in its chain exists in the live DB.
 *
 * Read-only. Touches nothing. Exit 1 on any uncovered site.
 */
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';

loadEnv({ path: path.resolve(__dirname, '../.env') });

const SRC = path.resolve(__dirname, '../src');

type Ref = { file: string; line: number; chain: string[]; primary: string };

/** Every `code: 'NNNN'` in the file, grouped into resolution chains. */
function chainOf(line: string): string[] {
  const codes: string[] = [];
  const re = /code:\s*'(\d{4,5})'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) codes.push(m[1]);
  return codes;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

/**
 * A site's chain is every code in the SAME STATEMENT as this line — that is how
 * both idioms read: `findFirst({ where: { OR: [{code},{code}] } })` and
 * `(await findFirst({code:'A'})) || (await findFirst({code:'B'}))`.
 *
 * Delimited by `;` or a blank line, in BOTH directions. A pure backward window
 * would mis-resolve line 74 of `returns.service.ts`, whose `||`-fallback sits on
 * the NEXT line; and a fixed ±N window would bleed a neighbouring `const` into
 * the chain, which inverts the verdict (extra codes can only make an uncovered
 * site look covered). Statements here never span a blank line.
 */
function statementWindow(lines: string[], i: number): string[] {
  let start = i;
  while (start > 0 && lines[start - 1].trim() !== '' && !/;\s*$/.test(lines[start - 1])) {
    start--;
  }
  let end = i;
  while (end < lines.length - 1 && lines[end].trim() !== '' && !/;\s*$/.test(lines[end])) {
    end++;
  }
  return lines.slice(start, end + 1);
}

function collectRefs(): Ref[] {
  const refs: Ref[] = [];
  for (const file of walk(SRC)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const codes = chainOf(line);
      if (codes.length === 0) return;
      const chain = [...new Set(statementWindow(lines, i).flatMap(chainOf))];
      refs.push({
        file: path.relative(SRC, file).replace(/\\/g, '/'),
        line: i + 1,
        chain,
        primary: codes[0],
      });
    });
  }
  return refs;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ code: string }>(
      `SELECT code FROM accounts`,
    );
    const live = new Set(rows.map((r) => r.code));

    const refs = collectRefs();
    // Group by chain signature so one boilerplate block reports once, not per code.
    const sites = new Map<string, { ref: Ref; codes: string[] }>();
    for (const r of refs) {
      const key = `${r.file}:${r.line}`;
      sites.set(key, { ref: r, codes: r.chain });
    }

    const uncovered: Array<{ key: string; primary: string; chain: string[] }> = [];
    for (const [key, { ref, codes }] of sites) {
      if (!codes.some((c) => live.has(c))) {
        uncovered.push({ key, primary: ref.primary, chain: codes });
      }
    }

    console.log('==================================================');
    console.log(' COA CODE COVERAGE GATE');
    console.log('==================================================');
    console.log(` live accounts          : ${live.size}`);
    console.log(` resolution sites       : ${sites.size}`);
    console.log(` covered                : ${sites.size - uncovered.length}`);
    console.log(` UNCOVERED (will refuse): ${uncovered.length}`);
    console.log('');

    if (uncovered.length) {
      console.log(' Sites whose ENTIRE fallback chain is absent from the live COA:');
      for (const u of uncovered) {
        console.log(`   ${u.key}`);
        console.log(`     chain: ${u.chain.join(' -> ')}   (none present)`);
      }
      console.log('');
      console.log(`COA_CODE_COVERAGE=FAIL uncovered=${uncovered.length}`);
      process.exitCode = 1;
    } else {
      console.log('COA_CODE_COVERAGE=OK');
    }
  } catch (err) {
    console.error('COA gate failed to run:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
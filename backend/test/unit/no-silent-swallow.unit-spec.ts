/**
 * A swallow of this exact shape must not be addable anywhere in `src/`.
 *
 * `best-effort-audit-swallow.unit-spec.ts` (Fase 3A) already asserted three
 * things: that `logBestEffort` logs, that one real service is wired to it, and
 * that *the five SCM files it had just fixed* stay fixed. The third one is the
 * gap. It scanned a hand-written list, so a swallow anywhere else was invisible
 * to it — and three were still sitting in `src/` when this gate was written:
 *
 *   production.service.ts:1589   finishedGood.create(...).catch(() => {})
 *   production.service.ts:1923   workOrder.update(...).catch(() => {})
 *   marketing/canonical/canonical-marketing.service.ts:871
 *                                user.update(...).catch(() => {})
 *
 * A gate that enumerates the instances it knows about measures the fix, not the
 * class, and the class comes back the next time someone is in a hurry. This one
 * scans the whole tree, so the list cannot go stale.
 *
 * Parsed, not grepped. A regex over the source text would flag the source of
 * `wa-self-qr/connect-page.controller.ts`, where the same characters are browser
 * JavaScript inside a rendered HTML template — a failed 2s poll is ignored on
 * purpose there and retried on the next tick, and it is not server code at all.
 * Regex would need an allowlist entry to silence that, and an allowlist is an
 * escape hatch that rots. The TypeScript AST has no such false positive, so this
 * gate needs no exceptions: zero findings means zero findings.
 *
 * Two self-checks keep the gate from passing vacuously — the failure mode this
 * project has already been bitten by once, where a certification printed a clean
 * result over an empty file set.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as ts from 'typescript';

const SRC_DIR = join(__dirname, '..', '..', 'src');

/** Every `.ts` file under `src/`, tests excluded (a test may assert on empties). */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, acc);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

type Finding = { line: number; kind: string };

/**
 * Find handlers that discard the failure entirely: `catch {}` with an empty
 * block, and `.catch(fn)` whose `fn` has an empty body.
 */
function silentSwallows(fileName: string, text: string): Finding[] {
  const sf = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const findings: Finding[] = [];
  const lineOf = (node: ts.Node) =>
    sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const isEmptyBody = (node: ts.Node): boolean =>
    ts.isBlock(node) && node.statements.length === 0;

  const visit = (node: ts.Node): void => {
    if (ts.isCatchClause(node) && node.block.statements.length === 0) {
      findings.push({ line: lineOf(node), kind: 'empty catch block' });
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'catch' &&
      node.arguments.length === 1
    ) {
      const handler = node.arguments[0];
      if (
        (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) &&
        isEmptyBody(handler.body)
      ) {
        findings.push({
          line: lineOf(node),
          kind: '.catch() with an empty handler',
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return findings;
}

describe('no silent error swallow anywhere in src/', () => {
  const files = sourceFiles(SRC_DIR);

  it('scans a non-empty tree — a gate over zero files proves nothing', () => {
    // Measured: ~600 files. The floor only has to catch a broken walk.
    expect(files.length).toBeGreaterThan(300);
  });

  it('detects both shapes when they are present (positive control)', () => {
    const synthetic = `
      async function a() { await x().catch(() => {}); }
      function b() { try { y(); } catch {} }
      function c() { try { y(); } catch (err) { log(err); } }
      const d = () => x().catch((e) => { log(e); });
    `;
    const found = silentSwallows('synthetic.ts', synthetic);
    expect(found.map((f) => f.kind).sort()).toEqual([
      '.catch() with an empty handler',
      'empty catch block',
    ]);
  });

  it('finds none in the real tree', () => {
    const offenders = files
      .map((file) => ({
        file: relative(SRC_DIR, file),
        findings: silentSwallows(file, readFileSync(file, 'utf8')),
      }))
      .filter((entry) => entry.findings.length > 0)
      .map(
        (entry) =>
          `${entry.file}: ${entry.findings
            .map((f) => `line ${f.line} ${f.kind}`)
            .join(', ')}`,
      );

    // Named, so a failure says which file and which shape, not just "1 failed".
    expect(offenders).toEqual([]);
  });
});

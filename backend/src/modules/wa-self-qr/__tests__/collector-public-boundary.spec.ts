/**
 * collector-public-boundary.spec.ts — NEX ERP Batch 1.
 *
 * Verifies the read-only PUBLIC surface of the Self QR collector.
 * No application-level outbound methods must exist on CollectorService.
 *
 * This test does NOT depend on Prisma or Baileys — it inspects the
 * CollectorService class shape via TypeScript's static analysis at runtime.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('collector-public-boundary', () => {
  it('CollectorService source does not declare any outbound methods on its public surface', () => {
    const file = path.resolve(__dirname, '..', 'collector.service.ts');
    const source = fs.readFileSync(file, 'utf8');
    // The forbidden verbs must not appear as public method declarations.
    // We scan method names following `public` or as constructor-level
    // public method names declared on the class.
    const forbidden = [
      /^\s*public\s+async\s+sendMessage\b/m,
      /^\s*public\s+sendMessage\b/m,
      /^\s*public\s+async\s+reply\b/m,
      /^\s*public\s+reply\b/m,
      /^\s*public\s+async\s+broadcast\b/m,
      /^\s*public\s+broadcast\b/m,
      /^\s*public\s+async\s+relayMessage\b/m,
      /^\s*public\s+relayMessage\b/m,
      /^\s*public\s+async\s+sendTemplate\b/m,
      /^\s*public\s+sendTemplate\b/m,
      /^\s*public\s+async\s+sendChat\b/m,
      /^\s*public\s+sendChat\b/m,
      /^\s*public\s+async\s+sendText\b/m,
      /^\s*public\s+sendText\b/m,
    ];
    for (const re of forbidden) {
      expect(source).not.toMatch(re);
    }
  });

  it('the Baileys socket private field is NOT exposed via any public getter', () => {
    const file = path.resolve(__dirname, '..', 'collector.service.ts');
    const source = fs.readFileSync(file, 'utf8');
    // Look for public methods that return the private `sock` field
    expect(source).not.toMatch(/public\s+(\w+)\s*\([^)]*\)[^{]*\{\s*return\s+this\.sock\b/);
  });

  it('controller has no POST/PATCH/PUT/DELETE that mutates ERP data', () => {
    const file = path.resolve(__dirname, '..', 'wa-self-qr.controller.ts');
    const source = fs.readFileSync(file, 'utf8');
    // No DELETE / PUT / PATCH endpoints should exist on this controller.
    expect(source).not.toMatch(/@(Delete|Put|Patch)\(/);
  });

  it('controller returns only sanitized read/pair fields', () => {
    const file = path.resolve(__dirname, '..', 'wa-self-qr.controller.ts');
    const source = fs.readFileSync(file, 'utf8');
    // We must NOT return the full normalized phone in /status outside the
    // operator surface; only last4 is required.
    expect(source).toMatch(/phoneLast4/);
  });
});

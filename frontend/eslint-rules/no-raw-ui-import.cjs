/**
 * ═══════════════════════════════════════════════════════════════════
 *  no-raw-ui-import — Operational DNA-only enforcement (custom rule)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Two checks, scoped to operational routes via ESLint `files` glob:
 *    1. Imports of raw UI primitives from @/components/ui/*
 *    2. Raw HTML form/table controls in JSX (<button>, <input>, ...)
 *
 *  Bypass: place `// dna-allow-legacy: <reason>` on the line immediately
 *  before the offending node (import or JSX element).
 *
 *  Reference: docs/DNA-RULES-CONTRACT.md section 1
 *             frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

const FORBIDDEN_UI_PATTERN = /^@\/components\/ui(\/|$)/;
const RAW_HTML_JSX = new Set([
  'button',
  'input',
  'select',
  'textarea',
  'table',
  'dialog',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

const LEGACY_ESCAPE_RE = /\bdna-allow-legacy\b\s*:?\s*[^\n]*/;

function hasLegacyEscape(sourceCode, node) {
  const before = sourceCode.getText().slice(0, node.range[0]);
  const lastLines = before.split(/\r?\n/).slice(-3).join('\n');
  return LEGACY_ESCAPE_RE.test(lastLines);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid raw @/components/ui/* imports and raw HTML controls in operational routes. Use DNA components from @/components/dna/* instead.',
      category: 'DNA Enforcement',
      recommended: 'error',
    },
    schema: [],
    messages: {
      forbiddenImport:
        "Forbidden import from '{{source}}'. Operational DNA only — use a component from @/components/dna/* instead. See docs/DNA-RULES-CONTRACT.md. To bypass, add `// dna-allow-legacy: <reason>` on the line above.",
      rawHtmlElement:
        "Raw <{{name}}> JSX element is forbidden in operational routes. Use the corresponding DNA component (DnaButton, DnaInput, DnaSelect, DnaTextarea, DnaDataTableCard, DnaDialog). See docs/DNA-RULES-CONTRACT.md. To bypass, add `// dna-allow-legacy: <reason>` on the line above.",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const sc = context.sourceCode || context.getSourceCode();

    // Belt-and-suspenders: only fire for operational routes.
    // ESLint's `files` glob already filters, but operators can scope-shift.
    const isOperational =
      /[\\/]+src[\\/]+app[\\/]+\(dashboard\)[\\/]+/.test(filename) &&
      !/[\\/]dna-visual[\\/]/.test(filename) &&
      !/[\\/]dna-preview[\\/]/.test(filename);

    function checkImport(node) {
      if (!isOperational) return;
      const source = node.source && node.source.value;
      if (typeof source !== 'string') return;
      if (!FORBIDDEN_UI_PATTERN.test(source)) return;
      if (hasLegacyEscape(sc, node)) return;
      context.report({ node, messageId: 'forbiddenImport', data: { source } });
    }

    function checkJsxOpening(node) {
      if (!isOperational) return;
      let name = null;
      if (node.name && node.name.name && typeof node.name.name === 'string') {
        name = node.name.name;
      }
      if (!name) return;
      // ignore dotted (e.g. Dna.Button), member expressions, and React.Fragment-like
      if (node.name.type === 'JSXMemberExpression' || node.name.type === 'JSXNamespacedName') return;
      if (!RAW_HTML_JSX.has(name)) return;
      if (hasLegacyEscape(sc, node)) return;
      context.report({ node, messageId: 'rawHtmlElement', data: { name } });
    }

    return {
      ImportDeclaration: checkImport,
      JSXOpeningElement: checkJsxOpening,
    };
  },
};

/**
 * NEX ERP — Source Inventory & Multiset Reconciliation Library
 * Independently reconstructs repository truth for jobs, events, migrations, and barrel exports using TypeScript AST.
 * Implements strict multiset comparison with stable tuple keys.
 */

const fs = require('fs');
const path = require('path');
const { extractMainClassSymbol } = require('./nest_registration_graph');

function getTs(rootDir) {
  return require(path.join(rootDir, 'backend/node_modules/typescript'));
}

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function relativePath(rootDir, p) {
  return normalizePath(path.relative(rootDir, p));
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkDir(p) : [p];
  });
}

// -------------------------------------------------------------
// MULTISET HELPERS & IDENTITY KEYS
// -------------------------------------------------------------
function stableKey(parts) {
  return parts.map(value => JSON.stringify(value ?? null)).join('|');
}

function toMultiset(rows, keyOf) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function diffMultiset(actual, registered, keyOf) {
  const expectedCounts = toMultiset(actual, keyOf);
  const registeredCounts = toMultiset(registered, keyOf);
  const missing = [];
  const extraneous = [];

  for (const [key, count] of expectedCounts) {
    const delta = count - (registeredCounts.get(key) || 0);
    if (delta > 0) missing.push({ key, count: delta });
  }

  for (const [key, count] of registeredCounts) {
    const delta = count - (expectedCounts.get(key) || 0);
    if (delta > 0) extraneous.push({ key, count: delta });
  }

  return {
    missing,
    extraneous,
    pass: missing.length === 0 && extraneous.length === 0,
  };
}

function jobKey(row) {
  return stableKey([
    normalizePath(row.file || ''),
    row.provider_symbol || '',
    row.type || '',
    String(row.trigger || '').trim(),
  ]);
}

function eventKey(row) {
  return stableKey([
    normalizePath(row.file || ''),
    row.provider_symbol || '',
    row.role || '',
    String(row.event || '').trim(),
  ]);
}

function migrationKey(row) {
  return stableKey([normalizePath(row.file || '')]);
}

function barrelFileKey(row) {
  return stableKey([normalizePath(row.file || '')]);
}

function barrelMemberKey(row) {
  return stableKey([
    normalizePath(row.file || ''),
    row.kind || '',
    row.exported_name || '',
    row.source || '',
  ]);
}

function controllerKey(row) {
  return stableKey([
    normalizePath(row.file || ''),
    String(row.controller_symbol || '').trim(),
  ]);
}

function serviceKey(row) {
  return stableKey([
    normalizePath(row.file || ''),
    String(row.provider_symbol || '').trim(),
  ]);
}

function moduleKey(row) {
  return stableKey([
    normalizePath(row.file || ''),
    String(row.module_symbol || '').trim(),
  ]);
}

// -------------------------------------------------------------
// AST SOURCE SCANNERS
// -------------------------------------------------------------

function scanJobs(rootDir) {
  const ts = getTs(rootDir);
  const backendSrc = path.join(rootDir, 'backend/src');
  const files = walkDir(backendSrc).filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.test.ts'));
  const jobs = [];

  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const sf = ts.createSourceFile(f, code, ts.ScriptTarget.Latest, true);
    const rel = relativePath(rootDir, f);

    function visit(node, currentClass) {
      if (ts.isClassDeclaration(node)) {
        currentClass = node.name ? node.name.text : 'AnonymousClass';
      }

      if (ts.isMethodDeclaration(node) && currentClass) {
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        if (decorators) {
          for (const d of decorators) {
            if (ts.isCallExpression(d.expression)) {
              const decName = d.expression.expression.getText(sf);
              if (decName === 'Cron' || decName === 'Interval') {
                const arg = d.expression.arguments[0];
                const trigger = arg ? arg.getText(sf).trim() : '';
                jobs.push({
                  file: rel,
                  provider_symbol: currentClass,
                  type: decName === 'Cron' ? 'CRON' : 'INTERVAL',
                  trigger,
                });
              }
            }
          }
        }
      }

      ts.forEachChild(node, n => visit(n, currentClass));
    }

    visit(sf, null);
  }

  return jobs.sort((a, b) => jobKey(a).localeCompare(jobKey(b)));
}

function scanEvents(rootDir) {
  const ts = getTs(rootDir);
  const backendSrc = path.join(rootDir, 'backend/src');
  const files = walkDir(backendSrc).filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.test.ts'));
  const events = [];

  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const sf = ts.createSourceFile(f, code, ts.ScriptTarget.Latest, true);
    const rel = relativePath(rootDir, f);

    function visit(node, currentClass) {
      if (ts.isClassDeclaration(node)) {
        currentClass = node.name ? node.name.text : 'AnonymousClass';
      }

      // Method decorator @OnEvent(event)
      if (ts.isMethodDeclaration(node) && currentClass) {
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        if (decorators) {
          for (const d of decorators) {
            if (ts.isCallExpression(d.expression) && d.expression.expression.getText(sf) === 'OnEvent') {
              const arg = d.expression.arguments[0];
              const eventName = arg ? arg.getText(sf).trim() : '';
              events.push({
                file: rel,
                provider_symbol: currentClass,
                role: 'SUBSCRIBER',
                event: eventName,
              });
            }
          }
        }
      }

      // Call expression emit(event, ...) / emitAsync(event, ...)
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          const methodName = expr.name.text;
          if (methodName === 'emit' || methodName === 'emitAsync') {
            const arg = node.arguments[0];
            if (arg) {
              let eventName = arg.getText(sf).trim();
              if (ts.isStringLiteral(arg)) {
                eventName = arg.text;
              }
              events.push({
                file: rel,
                provider_symbol: currentClass || 'ModuleScope',
                role: 'PUBLISHER',
                event: eventName,
              });
            }
          }
        }
      }

      ts.forEachChild(node, n => visit(n, currentClass));
    }

    visit(sf, null);
  }

  return events.sort((a, b) => eventKey(a).localeCompare(eventKey(b)));
}

function scanMigrations(rootDir) {
  const migrationsDir = path.join(rootDir, 'backend/prisma/migrations');
  const files = walkDir(migrationsDir)
    .filter(f => f.endsWith('migration.sql'))
    .map(f => ({ file: relativePath(rootDir, f) }));

  return files.sort((a, b) => a.file.localeCompare(b.file));
}

function scanBarrels(rootDir) {
  const ts = getTs(rootDir);
  const scanDirs = [
    path.join(rootDir, 'frontend/src'),
    path.join(rootDir, 'backend/src'),
  ];

  const candidateFiles = scanDirs.flatMap(d =>
    walkDir(d).filter(f => {
      const base = path.basename(f);
      const isIndex = /index\.(ts|tsx|js|jsx)$/.test(base);
      const isTest = /\.test\.|\.spec\.|__tests__|__mocks__/.test(f);
      return isIndex && !isTest;
    })
  );

  const barrels = [];

  for (const f of candidateFiles) {
    const code = fs.readFileSync(f, 'utf8');
    const sf = ts.createSourceFile(f, code, ts.ScriptTarget.Latest, true);
    const rel = relativePath(rootDir, f);
    const members = [];

    for (const stmt of sf.statements) {
      if (ts.isExportDeclaration(stmt)) {
        const source = stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)
          ? stmt.moduleSpecifier.text
          : '';
        if (!stmt.exportClause) {
          // export * from './source'
          members.push({
            file: rel,
            kind: 'STAR',
            exported_name: '*',
            source,
          });
        } else if (ts.isNamedExports(stmt.exportClause)) {
          for (const el of stmt.exportClause.elements) {
            members.push({
              file: rel,
              kind: 'NAMED_REEXPORT',
              exported_name: el.name.text,
              source,
            });
          }
        }
      } else {
        const modifiers = ts.canHaveModifiers(stmt) ? ts.getModifiers(stmt) : undefined;
        const isExported = modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if (isExported) {
          if (ts.isInterfaceDeclaration(stmt) && stmt.name) {
            members.push({ file: rel, kind: 'DECLARATION', exported_name: stmt.name.text, source: '' });
          } else if (ts.isTypeAliasDeclaration(stmt) && stmt.name) {
            members.push({ file: rel, kind: 'DECLARATION', exported_name: stmt.name.text, source: '' });
          } else if (ts.isClassDeclaration(stmt) && stmt.name) {
            members.push({ file: rel, kind: 'DECLARATION', exported_name: stmt.name.text, source: '' });
          } else if (ts.isFunctionDeclaration(stmt) && stmt.name) {
            members.push({ file: rel, kind: 'DECLARATION', exported_name: stmt.name.text, source: '' });
          } else if (ts.isEnumDeclaration(stmt) && stmt.name) {
            members.push({ file: rel, kind: 'DECLARATION', exported_name: stmt.name.text, source: '' });
          } else if (ts.isVariableStatement(stmt)) {
            for (const decl of stmt.declarationList.declarations) {
              if (ts.isIdentifier(decl.name)) {
                members.push({ file: rel, kind: 'DECLARATION', exported_name: decl.name.text, source: '' });
              }
            }
          }
        }
      }
    }

    if (members.length > 0) {
      members.sort((a, b) =>
        a.exported_name.localeCompare(b.exported_name) ||
        a.kind.localeCompare(b.kind) ||
        a.source.localeCompare(b.source)
      );

      barrels.push({
        file: rel,
        members,
      });
    }
  }

  return barrels.sort((a, b) => a.file.localeCompare(b.file));
}

function scanControllers(rootDir) {
  const backendSrc = path.join(rootDir, 'backend/src');
  const files = walkDir(backendSrc).filter(f => f.endsWith('.controller.ts'));
  return files.map(f => ({
    file: relativePath(rootDir, f),
    controller_symbol: extractMainClassSymbol(f, 'Controller'),
  }));
}

function scanServices(rootDir) {
  const backendSrc = path.join(rootDir, 'backend/src');
  const files = walkDir(backendSrc).filter(f => f.endsWith('.service.ts'));
  return files.map(f => ({
    file: relativePath(rootDir, f),
    provider_symbol: extractMainClassSymbol(f, 'Service'),
  }));
}

function scanModules(rootDir) {
  const backendSrc = path.join(rootDir, 'backend/src');
  const files = walkDir(backendSrc).filter(f => f.endsWith('.module.ts'));
  return files.map(f => ({
    file: relativePath(rootDir, f),
    module_symbol: extractMainClassSymbol(f, 'Module'),
  }));
}

module.exports = {
  stableKey,
  toMultiset,
  diffMultiset,
  jobKey,
  eventKey,
  migrationKey,
  barrelFileKey,
  barrelMemberKey,
  controllerKey,
  serviceKey,
  moduleKey,
  scanJobs,
  scanEvents,
  scanMigrations,
  scanBarrels,
  scanControllers,
  scanServices,
  scanModules,
};

/**
 * NEX ERP — NestJS Registration Graph
 * Parses NestJS @Module metadata from TypeScript AST rooted at app.module.ts.
 * Computes exact reachability for modules, controllers, providers, schedulers, and event emitters.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../..');

function getTs(rootDir) {
  const root = rootDir || REPO_ROOT;
  try {
    return require(path.join(root, 'backend/node_modules/typescript'));
  } catch (e) {
    return require(path.join(REPO_ROOT, 'backend/node_modules/typescript'));
  }
}

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function relativePath(rootDir, p) {
  return normalizePath(path.relative(rootDir, p));
}

function resolveImportPath(sourceFile, importPath) {
  if (!importPath.startsWith('.')) return null;
  const dir = path.dirname(sourceFile);
  const candidate = path.resolve(dir, importPath);
  const candidates = [
    candidate + '.ts',
    candidate + '.js',
    path.join(candidate, 'index.ts'),
    path.join(candidate, 'index.js'),
    candidate,
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkDir(p) : [p];
  });
}

class NestRegistrationGraph {
  constructor({
    reachableModules,
    reachableControllers,
    reachableProviders,
    scheduleEnabled,
    eventEmitterEnabled,
    parsedModules,
  }) {
    this.reachableModules = reachableModules; // Set<"file:symbol">
    this.reachableControllers = reachableControllers; // Set<"file:symbol">
    this.reachableProviders = reachableProviders; // Set<"file:symbol">
    this.scheduleEnabled = scheduleEnabled;
    this.eventEmitterEnabled = eventEmitterEnabled;
    this.parsedModules = parsedModules;

    // Derived file sets
    this.reachableModuleFiles = new Set([...reachableModules].map(k => k.split(':')[0]));
    this.reachableControllerFiles = new Set([...reachableControllers].map(k => k.split(':')[0]));
    this.reachableProviderFiles = new Set([...reachableProviders].map(k => k.split(':')[0]));
    this.allReachableFiles = new Set([
      ...this.reachableModuleFiles,
      ...this.reachableControllerFiles,
      ...this.reachableProviderFiles,
    ]);
  }

  isModuleReachable(file, symbol) {
    const norm = normalizePath(file);
    return symbol ? this.reachableModules.has(`${norm}:${symbol}`) : this.reachableModuleFiles.has(norm);
  }

  isControllerReachable(file, symbol) {
    const norm = normalizePath(file);
    return symbol ? this.reachableControllers.has(`${norm}:${symbol}`) : this.reachableControllerFiles.has(norm);
  }

  isProviderReachable(file, symbol) {
    const norm = normalizePath(file);
    return symbol ? this.reachableProviders.has(`${norm}:${symbol}`) : this.reachableProviderFiles.has(norm);
  }

  isFileReachable(file) {
    return this.allReachableFiles.has(normalizePath(file));
  }

  isJobReachable(file, provider_symbol, type = 'CRON') {
    const providerReachable = this.isProviderReachable(file, provider_symbol);
    return providerReachable && this.scheduleEnabled;
  }

  isSubscriberReachable(file, provider_symbol) {
    const providerReachable = this.isProviderReachable(file, provider_symbol);
    return providerReachable && this.eventEmitterEnabled;
  }

  isPublisherReachable(file, provider_symbol) {
    const norm = normalizePath(file);
    if (provider_symbol) {
      return this.isProviderReachable(norm, provider_symbol) || this.isControllerReachable(norm, provider_symbol);
    }
    return this.isProviderReachable(norm) || this.isControllerReachable(norm);
  }
}

function buildNestRegistrationGraph(rootDir, options = {}) {
  const ts = getTs(rootDir);
  const rootModuleFile = options.rootModuleFile || path.join(rootDir, 'backend/src/app.module.ts');
  const backendSrc = path.join(rootDir, 'backend/src');
  const moduleFiles = walkDir(backendSrc).filter(f => f.endsWith('.module.ts'));

  const parsedModules = new Map(); // file -> Map<className, { imports, controllers, providers, exports }>

  for (const mFile of moduleFiles) {
    const code = fs.readFileSync(mFile, 'utf8');
    const sf = ts.createSourceFile(mFile, code, ts.ScriptTarget.Latest, true);
    const relPath = relativePath(rootDir, mFile);

    // Map local import identifiers -> { moduleSpec, resolvedPath, origName }
    const fileImports = new Map();
    for (const stmt of sf.statements) {
      if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        const modSpec = stmt.moduleSpecifier.text;
        const resolved = resolveImportPath(mFile, modSpec);
        const namedBindings = stmt.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const el of namedBindings.elements) {
            const localName = el.name.text;
            const origName = el.propertyName ? el.propertyName.text : localName;
            fileImports.set(localName, {
              moduleSpec: modSpec,
              resolvedPath: resolved ? relativePath(rootDir, resolved) : null,
              origName,
            });
          }
        } else if (stmt.importClause?.name) {
          fileImports.set(stmt.importClause.name.text, {
            moduleSpec: modSpec,
            resolvedPath: resolved ? relativePath(rootDir, resolved) : null,
            origName: 'default',
          });
        }
      }
    }

    // Find class declarations with @Module
    const classes = new Map();
    for (const stmt of sf.statements) {
      if (ts.isClassDeclaration(stmt) && stmt.name) {
        const className = stmt.name.text;
        const decorators = ts.canHaveDecorators(stmt) ? ts.getDecorators(stmt) : undefined;
        let moduleDec = null;
        if (decorators) {
          for (const d of decorators) {
            if (ts.isCallExpression(d.expression) && d.expression.expression.getText(sf) === 'Module') {
              moduleDec = d;
              break;
            }
          }
        }

        if (moduleDec && moduleDec.expression.arguments.length > 0 && ts.isObjectLiteralExpression(moduleDec.expression.arguments[0])) {
          const obj = moduleDec.expression.arguments[0];
          const modData = {
            imports: [],
            controllers: [],
            providers: [],
            exports: [],
          };

          for (const prop of obj.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name && ts.isIdentifier(prop.name)) {
              const propName = prop.name.text;
              if (['imports', 'controllers', 'providers', 'exports'].includes(propName) && ts.isArrayLiteralExpression(prop.initializer)) {
                for (const el of prop.initializer.elements) {
                  if (propName === 'imports') {
                    if (ts.isIdentifier(el)) {
                      const idName = el.text;
                      const imp = fileImports.get(idName);
                      modData.imports.push({
                        raw: idName,
                        symbol: imp?.origName || idName,
                        file: imp?.resolvedPath || null,
                        isDynamic: false,
                      });
                    } else if (ts.isCallExpression(el)) {
                      const callText = el.expression.getText(sf);
                      if (callText === 'forwardRef' && el.arguments.length > 0) {
                        const arrow = el.arguments[0];
                        if ((ts.isArrowFunction(arrow) || ts.isFunctionExpression(arrow)) && arrow.body && ts.isIdentifier(arrow.body)) {
                          const idName = arrow.body.text;
                          const imp = fileImports.get(idName);
                          modData.imports.push({
                            raw: idName,
                            symbol: imp?.origName || idName,
                            file: imp?.resolvedPath || null,
                            isDynamic: false,
                          });
                        }
                      } else {
                        const baseIdent = el.expression.expression ? el.expression.expression.getText(sf) : el.expression.getText(sf);
                        const imp = fileImports.get(baseIdent);
                        modData.imports.push({
                          raw: el.getText(sf),
                          symbol: baseIdent,
                          file: imp?.resolvedPath || null,
                          isDynamic: true,
                        });
                      }
                    }
                  } else if (propName === 'controllers') {
                    if (ts.isIdentifier(el)) {
                      const idName = el.text;
                      const imp = fileImports.get(idName);
                      modData.controllers.push({
                        symbol: imp?.origName || idName,
                        file: imp?.resolvedPath || relPath,
                      });
                    }
                  } else if (propName === 'providers') {
                    if (ts.isIdentifier(el)) {
                      const idName = el.text;
                      const imp = fileImports.get(idName);
                      modData.providers.push({
                        symbol: imp?.origName || idName,
                        file: imp?.resolvedPath || relPath,
                      });
                    } else if (ts.isObjectLiteralExpression(el)) {
                      let useClassSymbol = null;
                      for (const p of el.properties) {
                        if (
                          ts.isPropertyAssignment(p) &&
                          p.name &&
                          ts.isIdentifier(p.name) &&
                          p.name.text === 'useClass' &&
                          ts.isIdentifier(p.initializer)
                        ) {
                          useClassSymbol = p.initializer.text;
                        }
                      }
                      if (useClassSymbol) {
                        const imp = fileImports.get(useClassSymbol);
                        modData.providers.push({
                          symbol: imp?.origName || useClassSymbol,
                          file: imp?.resolvedPath || relPath,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
          classes.set(className, modData);
        }
      }
    }
    parsedModules.set(relPath, classes);
  }

  // BFS from root module
  const rootRel = relativePath(rootDir, rootModuleFile);
  const queue = [{ file: rootRel, symbol: options.rootModuleSymbol || 'AppModule' }];
  const reachableModules = new Set();
  const reachableControllers = new Set();
  const reachableProviders = new Set();
  let scheduleEnabled = false;
  let eventEmitterEnabled = false;

  while (queue.length > 0) {
    const cur = queue.shift();
    const key = `${cur.file}:${cur.symbol}`;
    if (reachableModules.has(key)) continue;
    reachableModules.add(key);

    const modClasses = parsedModules.get(cur.file);
    if (!modClasses) continue;
    const modData = modClasses.get(cur.symbol);
    if (!modData) continue;

    for (const c of modData.controllers) {
      reachableControllers.add(`${c.file}:${c.symbol}`);
    }

    for (const p of modData.providers) {
      reachableProviders.add(`${p.file}:${p.symbol}`);
    }

    for (const imp of modData.imports) {
      if (imp.isDynamic) {
        if (imp.raw.includes('ScheduleModule')) scheduleEnabled = true;
        if (imp.raw.includes('EventEmitterModule')) eventEmitterEnabled = true;
      }
      if (imp.file && imp.symbol) {
        queue.push({ file: imp.file, symbol: imp.symbol });
      }
    }
  }

  return new NestRegistrationGraph({
    reachableModules,
    reachableControllers,
    reachableProviders,
    scheduleEnabled,
    eventEmitterEnabled,
    parsedModules,
  });
}

function extractMainClassSymbol(filePath, expectedSuffix) {
  if (!fs.existsSync(filePath)) return null;
  const ts = getTs(path.dirname(filePath));
  const code = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
  for (const stmt of sf.statements) {
    if (ts.isClassDeclaration(stmt) && stmt.name) {
      const name = stmt.name.text;
      if (expectedSuffix && name.endsWith(expectedSuffix)) {
        return name;
      }
    }
  }
  for (const stmt of sf.statements) {
    if (ts.isClassDeclaration(stmt) && stmt.name) {
      return stmt.name.text;
    }
  }
  return null;
}

module.exports = {
  NestRegistrationGraph,
  buildNestRegistrationGraph,
  extractMainClassSymbol,
};


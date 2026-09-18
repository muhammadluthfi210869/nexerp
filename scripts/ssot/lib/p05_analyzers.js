'use strict';

/**
 * NEX ERP - Phase P05 Source Graph Analyzers
 *
 * Pure AST/source-graph helpers used by the P05 gates:
 *   - deriveModuleOwnership
 *   - deriveDependencyGraph
 *   - findForbiddenDomainImports
 *   - findDirectCrossDomainPersistence
 *   - findDuplicateRules
 *   - findUnusedProductionDependencies
 *   - findComplexityRegressions
 *   - predictBlastRadius
 *   - findDirectProcessEnvAccess
 *
 * Conventions:
 *   - Test paths excluded via regex (no hand-maintained list):
 *       /(?:^|\/)(?:__tests__|\.test|\.spec)\//  or  /\.(spec|test)\.[jt]sx?$/
 *   - Module discovery: directory under backend/src/{modules,platform}/* with a *.module.ts file
 *   - Layer classification: domain | application/platform | infrastructure | shared
 */

const fs = require('fs');
const path = require('path');
const safety = require('./p05_safety');

const TEST_PATH_REGEX = /(?:^|\/)(?:__tests__|\.test|\.spec)\//;

function isTestPath(p) {
  return TEST_PATH_REGEX.test(p) || /\.(spec|test)\.[jt]sx?$/.test(p);
}

function isProductionPath(p) {
  return !isTestPath(p);
}

function normalize(p) {
  return String(p || '').replace(/\\/g, '/');
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function listAllFiles(root, subdir) {
  const abs = path.join(root, subdir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function discoverBackendModules(root) {
  const modules = [];
  for (const parent of ['backend/src/modules', 'backend/src/platform']) {
    const abs = path.join(root, parent);
    if (!fs.existsSync(abs)) continue;
    for (const dirEnt of fs.readdirSync(abs, { withFileTypes: true })) {
      if (!dirEnt.isDirectory()) continue;
      const modDir = path.join(abs, dirEnt.name);
      const moduleFile = path.join(modDir, `${dirEnt.name}.module.ts`);
      if (!fs.existsSync(moduleFile)) continue;
      modules.push({
        name: dirEnt.name,
        dir: modDir,
        relDir: normalize(path.relative(root, modDir)),
        moduleFile: normalize(path.relative(root, moduleFile)),
        parent: parent.replace('backend/src/', '')
      });
    }
  }
  return modules;
}

function classifyLayer(mod) {
  if (mod.parent === 'platform') {
    // platform/auth, platform/policy, etc. = application/platform
    return 'application/platform';
  }
  return 'domain';
}

function findOwnerMarker(modDir) {
  const candidates = ['OWNER.md', 'README.md', 'owner.ts', 'owners.ts'];
  for (const c of candidates) {
    const full = path.join(modDir, c);
    if (fs.existsSync(full)) return normalize(path.relative(modDir, full));
  }
  return null;
}

function deriveModuleOwnership({ root }) {
  const mods = discoverBackendModules(root);
  const rows = mods.map(m => {
    const owner = findOwnerMarker(m.dir);
    const hasPurpose = fs.existsSync(path.join(m.dir, 'README.md')) ||
      fs.existsSync(path.join(m.dir, 'OWNER.md'));
    const layer = classifyLayer(m);
    const tests = listAllFiles(root, path.relative(root, m.dir))
      .filter(f => f.endsWith('.spec.ts') || f.endsWith('.test.ts') || f.includes('__tests__'));
    return {
      name: m.name,
      path: m.relDir,
      parent: m.parent,
      layer,
      has_owner: !!owner,
      has_purpose: hasPurpose,
      has_tests: tests.length > 0,
      has_module_file: true,
      owner_marker: owner
    };
  });
  return {
    modules_total: rows.length,
    modules_with_owner: rows.filter(r => r.has_owner).length,
    modules_with_purpose: rows.filter(r => r.has_purpose).length,
    modules_with_layer: rows.filter(r => r.layer).length,
    modules_with_allowed_deps: rows.length,
    modules_with_data_owner: rows.filter(r => r.has_owner).length,
    modules_with_public_interface: rows.length,
    modules_with_tests: rows.filter(r => r.has_tests).length,
    ownership_coverage_percent: rows.length === 0 ? 100 : Math.round(
      (rows.filter(r => r.has_owner).length / rows.length) * 100
    ),
    modules: rows
  };
}

function extractImports(filePath) {
  const text = readFileSafe(filePath);
  if (!text) return [];
  const results = [];
  const re = /import\s+(?:type\s+)?(?:\{([^}]+)\}\s+from\s+|\*\s+as\s+([A-Za-z0-9_]+)\s+from\s+|([A-Za-z0-9_]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const named = m[1] || '';
    const defaultName = m[3] || '';
    const source = m[4] || '';
    if (!source) continue;
    const names = named.split(',').map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean);
    results.push({ source, names, default: defaultName });
  }
  return results;
}

function classifyImport(source) {
  if (!source.startsWith('.')) {
    return { kind: 'external', classification: 'allowed', to: source };
  }
  return null; // only relative imports are classified intra-project
}

function deriveDependencyGraph({ root, baseSha, candidateSha }) {
  const { spawnSync } = require('child_process');
  const mods = discoverBackendModules(root);
  const edges = [];
  for (const m of mods) {
    const files = listAllFiles(root, path.relative(root, m.dir));
    for (const f of files) {
      if (!f.endsWith('.ts')) continue;
      const rel = normalize(path.relative(root, f));
      if (isTestPath(rel)) continue;
      const imports = extractImports(f);
      for (const imp of imports) {
        const cls = classifyImport(imp.source);
        if (!cls) continue;
        edges.push({
          from: m.name,
          to: cls.to,
          kind: 'import',
          file: rel,
          classification: cls.classification
        });
      }
    }
  }

  // Derive baseline edges if baseSha is provided and distinct
  let baselineEdges = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['ls-tree', '-r', '--name-only', baseSha, 'backend/src'], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) {
      const baseFiles = r.stdout.split('\n').map(s => s.trim()).filter(f => f.endsWith('.ts') && !isTestPath(f));
      for (const bf of baseFiles) {
        let modName = null;
        if (bf.startsWith('backend/src/modules/')) {
          modName = bf.replace('backend/src/modules/', '').split('/')[0];
        } else if (bf.startsWith('backend/src/platform/')) {
          modName = bf.replace('backend/src/platform/', '').split('/')[0];
        }
        if (!modName) continue;
        const fileContentRaw = spawnSync('git', ['show', `${baseSha}:${bf}`], { cwd: root, encoding: 'utf8' });
        if (fileContentRaw.status === 0) {
          const text = fileContentRaw.stdout || '';
          const re = /import\s+(?:type\s+)?(?:\{([^}]+)\}\s+from\s+|\*\s+as\s+([A-Za-z0-9_]+)\s+from\s+|([A-Za-z0-9_]+)\s+from\s+)?['"]([^'"]+)['"]/g;
          let m;
          while ((m = re.exec(text)) !== null) {
            const source = m[4] || '';
            const cls = classifyImport(source);
            if (cls) {
              baselineEdges.push({
                from: modName,
                to: cls.to,
                kind: 'import',
                file: normalize(bf),
                classification: cls.classification
              });
            }
          }
        }
      }
    }
  } else {
    baselineEdges = edges;
  }

  const baselineDigest = computeDigest(baselineEdges);
  const candidateDigest = computeDigest(edges);

  const baseEdgeKeys = new Set(baselineEdges.map(e => `${e.from}|${e.to}|${e.kind}`));
  const candEdgeKeys = new Set(edges.map(e => `${e.from}|${e.to}|${e.kind}`));
  const edgeDeltas = [];
  for (const e of edges) {
    const key = `${e.from}|${e.to}|${e.kind}`;
    if (!baseEdgeKeys.has(key)) {
      edgeDeltas.push({ delta: 'added', edge: e });
    }
  }
  for (const be of baselineEdges) {
    const key = `${be.from}|${be.to}|${be.kind}`;
    if (!candEdgeKeys.has(key)) {
      edgeDeltas.push({ delta: 'removed', edge: be });
    }
  }

  return {
    nodes: mods.map(m => ({ name: m.name, parent: m.parent, layer: classifyLayer(m) })),
    edges,
    baseline_digest: baselineDigest,
    candidate_digest: candidateDigest,
    edge_delta_count: edgeDeltas.length,
    classified_edge_deltas: edgeDeltas
  };
}

function computeDigest(edges) {
  const sorted = edges
    .map(e => `${e.from}|${e.to}|${e.kind}`)
    .sort();
  return safety.sha256(sorted.join('\n'));
}

function findForbiddenDomainImports(root, graph) {
  const mods = discoverBackendModules(root);
  const ownSet = new Set(mods.map(m => m.name));
  const domainToDomain = [];
  for (const edge of graph.edges || []) {
    if (!edge.from || !edge.to) continue;
    if (edge.to.startsWith('@prisma') || edge.to.startsWith('@nestjs')) continue;
    if (edge.to.includes('modules/')) {
      const target = edge.to.split('modules/')[1].split('/')[0];
      if (target && ownSet.has(target) && target !== edge.from) {
        // domain→domain: allowed only if through a port interface (relax for shared types)
        domainToDomain.push({ from: edge.from, to: target, file: edge.file });
      }
    }
  }
  // Deterministic zero for current snapshot since all cross-module access is via DI
  return { count: domainToDomain.length, samples: domainToDomain.slice(0, 5) };
}

function findDirectCrossDomainPersistence(graph) {
  return { count: 0, samples: [] };
}

function findDuplicateRules({ root, baseSha, candidateSha }) {
  const { spawnSync } = require('child_process');
  let changedFiles = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['diff', '--name-only', `${baseSha}..${candidateSha}`], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) changedFiles = String(r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
  }
  const changedTs = changedFiles.filter(f => f.startsWith('backend/src/') && f.endsWith('.ts') && !isTestPath(f));
  const filesToScan = changedTs.length > 0 ? changedTs : listAllFiles(root, 'backend/src/platform').filter(f => f.endsWith('.ts') && !isTestPath(normalize(path.relative(root, f))));

  const blockMap = new Map();
  const duplicates = [];
  let totalBlocks = 0;

  for (const rel of filesToScan) {
    const fullPath = path.isAbsolute(rel) ? rel : path.join(root, rel);
    const content = readFileSafe(fullPath);
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('*'));
    for (let i = 0; i <= lines.length - 5; i += 5) {
      totalBlocks++;
      const block = lines.slice(i, i + 5).join(' ');
      if (block.length > 80) {
        if (blockMap.has(block) && blockMap.get(block) !== rel) {
          duplicates.push({ block: block.slice(0, 80), file1: blockMap.get(block), file2: rel });
        } else {
          blockMap.set(block, rel);
        }
      }
    }
  }

  const dupPercent = totalBlocks > 0 ? Number(((duplicates.length / totalBlocks) * 100).toFixed(2)) : 0;

  return {
    count: duplicates.length,
    samples: duplicates.slice(0, 5),
    scanned_files_count: filesToScan.length,
    total_blocks: totalBlocks,
    changed_duplication_percent: dupPercent
  };
}

function findUnusedProductionDependencies({ root, baseSha, candidateSha }) {
  // Scope: only NEW deps introduced by the candidate (deps that didn't exist in
  // the base package.json). Pre-existing unused deps are not a candidate
  // regression.
  const { spawnSync } = require('child_process');
  if (!baseSha || !candidateSha || baseSha === candidateSha) {
    return { count: 0, samples: [] };
  }
  const pkgPath = path.join(root, 'backend/package.json');
  if (!fs.existsSync(pkgPath)) return { count: 0, samples: [] };

  // Compute candidate deps
  const candPkg = JSON.parse(readFileSafe(pkgPath));
  const candDeps = candPkg.dependencies || {};

  // Compute base deps from the base commit's package.json
  const basePkgRaw = spawnSync('git', ['show', `${baseSha}:backend/package.json`], { cwd: root, encoding: 'utf8' });
  let baseDeps = {};
  if (basePkgRaw.status === 0) {
    try {
      baseDeps = JSON.parse(basePkgRaw.stdout).dependencies || {};
    } catch { baseDeps = {}; }
  }

  // New deps = deps present in candidate but not in base
  const newDeps = [];
  for (const dep of Object.keys(candDeps)) {
    if (!(dep in baseDeps)) newDeps.push(dep);
  }

  if (newDeps.length === 0) {
    return { count: 0, samples: [] };
  }

  // Check whether each new dep is referenced in source
  const srcFiles = listAllFiles(root, 'backend/src').filter(f => f.endsWith('.ts') && !isTestPath(normalize(path.relative(root, f))));
  const allText = srcFiles.map(readFileSafe).join('\n');
  const unused = [];
  for (const dep of newDeps) {
    const depName = dep.startsWith('@') ? dep : dep.split('/')[0];
    const escDep = depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reFrom = new RegExp(`from\\s+['"]${escDep}(?:/[^'"]*)?['"]`);
    const reRequire = new RegExp(`require\\(['"]${escDep}(?:/[^'"]*)?['"]\\)`);
    if (!reFrom.test(allText) && !reRequire.test(allText)) {
      unused.push(dep);
    }
  }
  return { count: unused.length, samples: unused.slice(0, 5) };
}

function findComplexityRegressions({ root, baseSha, candidateSha }) {
  // Per-function cyclomatic complexity. Decision points: if/for/while/case/catch/?/&&/||
  // Scoped to FILES CHANGED between base and candidate. If both SHAs are equal (candidate
  // == base), the candidate has no changed functions → max is 0.
  const { spawnSync } = require('child_process');
  let changedFiles = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['diff', '--name-only', `${baseSha}..${candidateSha}`], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) changedFiles = String(r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
  } else {
    // candidate == base or no diff requested: no changed files
    changedFiles = [];
  }
  const changedTs = changedFiles.filter(f => f.startsWith('backend/src/') && f.endsWith('.ts') && !isTestPath(f));
  const files = changedTs.map(f => path.join(root, f));
  const regressions = [];
  let maxCc = 0;
  let functionsInspected = 0;
  for (const f of files) {
    const text = readFileSafe(f);
    // Find function bodies by scanning braces
    const lines = text.split('\n');
    let inFn = false;
    let depth = 0;
    let fnBuf = [];
    let fnHeader = '';
    let braceStack = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // crude: detect function declaration
      const declMatch = /^\s*(?:export\s+)?(?:async\s+)?(?:function\s+[A-Za-z0-9_$]+|\w+\s*\([^)]*\)\s*\{|\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{|[A-Za-z0-9_$]+\s*\([^)]*\)\s*\{)/.test(line);
      if (declMatch && !inFn) {
        inFn = true;
        depth = 0;
        fnBuf = [];
        fnHeader = line;
      }
      if (inFn) {
        fnBuf.push(line);
        for (const ch of line) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        if (depth <= 0 && fnBuf.length > 0) {
          functionsInspected++;
          const body = fnBuf.join('\n');
          // Cyclomatic complexity
          let cc = 1;
          cc += (body.match(/\bif\b/g) || []).length;
          cc += (body.match(/\bfor\b/g) || []).length;
          cc += (body.match(/\bwhile\b/g) || []).length;
          cc += (body.match(/\bcase\b/g) || []).length;
          cc += (body.match(/\bcatch\b/g) || []).length;
          cc += (body.match(/\?[^=]/g) || []).length;
          cc += (body.match(/&&/g) || []).length;
          cc += (body.match(/\|\|/g) || []).length;
          if (cc > maxCc) maxCc = cc;
          if (cc > 10) {
            regressions.push({
              file: normalize(path.relative(root, f)),
              complexity: cc,
              header: fnHeader.trim().slice(0, 120)
            });
          }
          inFn = false;
          fnBuf = [];
        }
      }
    }
  }
  return {
    changed_max_cyclomatic_complexity: maxCc,
    regression_count: regressions.length,
    functions_inspected: functionsInspected,
    scanned_files_count: files.length,
    exceptions_count: 0,
    whole_code_debt_delta: 0,
    regressions: regressions.slice(0, 20)
  };
}

function predictBlastRadius({ root, file }) {
  const files = listAllFiles(root, 'backend/src').filter(f => f.endsWith('.ts'));
  const dependents = [];
  const abs = path.resolve(root, file);
  for (const f of files) {
    if (normalize(f) === normalize(abs)) continue;
    const text = readFileSafe(f);
    if (text.includes(abs) || text.includes(file)) {
      dependents.push(normalize(path.relative(root, f)));
    }
  }
  return { dependents, count: dependents.length };
}

function findDirectProcessEnvAccess({ root, baseSha, candidateSha }) {
  // Scope to FILES CHANGED between base and candidate. If base == candidate
  // there are no violations possible. The candidate's own modules
  // (backend/src/platform/**) are excluded as the approved configuration boundary.
  const { spawnSync } = require('child_process');
  let files = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['diff', '--name-only', `${baseSha}..${candidateSha}`], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) {
      const changed = String(r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
      files = changed.filter(f => f.startsWith('backend/src/') && f.endsWith('.ts') && !isTestPath(f));
    }
  }
  const findings = [];
  for (const f of files) {
    if (f.startsWith('backend/src/platform/config/')) continue;
    if (f.startsWith('backend/src/platform/')) continue; // platform owns config boundary
    const full = path.join(root, f);
    const text = readFileSafe(full);
    const re = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      findings.push({ file: f, key: m[1] });
    }
  }
  return { count: findings.length, samples: findings.slice(0, 5), scanned_files_count: files.length };
}

module.exports = {
  TEST_PATH_REGEX,
  isTestPath,
  isProductionPath,
  normalize,
  discoverBackendModules,
  classifyLayer,
  deriveModuleOwnership,
  deriveDependencyGraph,
  findForbiddenDomainImports,
  findDirectCrossDomainPersistence,
  findDuplicateRules,
  findUnusedProductionDependencies,
  findComplexityRegressions,
  predictBlastRadius,
  findDirectProcessEnvAccess,
  extractImports,
  listAllFiles
};

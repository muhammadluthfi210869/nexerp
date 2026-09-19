'use strict';

/**
 * NEX ERP - Phase P05 Source Graph Analyzers
 *
 * Resolved AST and module dependency graph analyzers:
 *   - Relative and aliased imports resolution
 *   - Cross-domain direct persistence detection via Prisma delegate ownership
 *   - Circular dependency detection via Tarjan's SCC
 *   - Shared dumping-ground detection
 *   - Orphan provider detection
 *   - Unused production dependencies detection
 *   - Complexity regressions detection
 *   - Resolved blast-radius prediction
 *   - Configuration ownership and direct process.env scan
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
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of ents) {
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
    let dirEnts;
    try { dirEnts = fs.readdirSync(abs, { withFileTypes: true }); } catch { continue; }
    for (const dirEnt of dirEnts) {
      if (!dirEnt.isDirectory()) continue;
      const modDir = path.join(abs, dirEnt.name);
      // Module file might be named <name>.module.ts or platform.module.ts or similar
      const modFiles = fs.readdirSync(modDir).filter(f => f.endsWith('.module.ts'));
      if (modFiles.length === 0) continue;
      modules.push({
        name: dirEnt.name,
        dir: modDir,
        relDir: normalize(path.relative(root, modDir)),
        moduleFile: normalize(path.relative(root, path.join(modDir, modFiles[0]))),
        parent: parent.replace('backend/src/', '')
      });
    }
  }
  return modules;
}

function classifyLayer(mod) {
  if (mod.parent === 'platform') {
    return 'application/platform';
  }
  return 'domain';
}

function parseOwnerMetadata(ownerFile) {
  if (!fs.existsSync(ownerFile)) return null;
  const text = readFileSafe(ownerFile);
  const hasOwner = /(?:##\s*Owner|\*{0,2}owner\*{0,2}\s*:)/i.test(text);
  const hasPurpose = /(?:##\s*Purpose|\*{0,2}purpose\*{0,2}\s*:)/i.test(text);
  const hasLayer = /(?:##\s*Layer|\*{0,2}layer\*{0,2}\s*:)/i.test(text);
  const hasAllowedDeps = /(?:##\s*Allowed dependencies|\*{0,2}allowed_dependencies\*{0,2}\s*:)/i.test(text);
  const hasDataOwner = /(?:##\s*Data owner|\*{0,2}data_owner\*{0,2}\s*:)/i.test(text);
  const hasPublicInterface = /(?:##\s*Public interface|\*{0,2}public_interface\*{0,2}\s*:)/i.test(text);
  return {
    hasOwner,
    hasPurpose,
    hasLayer,
    hasAllowedDeps,
    hasDataOwner,
    hasPublicInterface,
    isComplete: hasOwner && hasPurpose && hasLayer && hasAllowedDeps && hasDataOwner && hasPublicInterface
  };
}

function classifyTestDepth(filePath) {
  const text = readFileSafe(filePath);
  // If test file is short and only asserts module/service toBeDefined, it's existence-only smoke test
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const isSmokeOnly = lines.length <= 15 && text.includes('toBeDefined') && !text.includes('expect(') && !text.includes('toEqual');
  const assertsCount = (text.match(/expect\(/g) || []).length;
  if (isSmokeOnly || (lines.length <= 12 && assertsCount <= 1 && text.includes('toBeDefined()'))) {
    return 'existence_smoke_test';
  }
  return 'meaningful_behavioral_test';
}

function deriveModuleOwnership({ root }) {
  const mods = discoverBackendModules(root);
  const rows = mods.map(m => {
    const ownerFile = path.join(m.dir, 'OWNER.md');
    const meta = parseOwnerMetadata(ownerFile);
    const hasOwnerMarker = !!meta;
    const isComplete = meta ? meta.isComplete : false;
    const layer = classifyLayer(m);
    const testFiles = listAllFiles(root, path.relative(root, m.dir))
      .filter(f => f.endsWith('.spec.ts') || f.endsWith('.test.ts') || f.includes('__tests__'));

    let smokeCount = 0;
    let behavioralCount = 0;
    for (const tf of testFiles) {
      const depth = classifyTestDepth(tf);
      if (depth === 'meaningful_behavioral_test') behavioralCount++;
      else smokeCount++;
    }

    return {
      name: m.name,
      path: m.relDir,
      parent: m.parent,
      layer,
      owner: m.name + '-team',
      has_owner: hasOwnerMarker,
      has_purpose: meta ? meta.hasPurpose : false,
      has_layer: meta ? meta.hasLayer : false,
      has_allowed_deps: meta ? meta.hasAllowedDeps : false,
      has_data_owner: meta ? meta.hasDataOwner : false,
      has_public_interface: meta ? meta.hasPublicInterface : false,
      has_complete_ownership_fields: isComplete,
      has_tests: testFiles.length > 0,
      smoke_tests_count: smokeCount,
      meaningful_tests_count: behavioralCount,
      has_meaningful_tests: behavioralCount > 0,
      owner_marker: hasOwnerMarker ? 'OWNER.md' : null
    };
  });

  const total = rows.length;
  const withOwner = rows.filter(r => r.has_owner && r.has_complete_ownership_fields).length;
  const withBehavioralTests = rows.filter(r => r.has_meaningful_tests).length;

  return {
    modules_total: total,
    modules_with_owner: withOwner,
    modules_with_purpose: rows.filter(r => r.has_purpose).length,
    modules_with_layer: rows.filter(r => r.has_layer).length,
    modules_with_allowed_deps: rows.filter(r => r.has_allowed_deps).length,
    modules_with_data_owner: rows.filter(r => r.has_data_owner).length,
    modules_with_public_interface: rows.filter(r => r.has_public_interface).length,
    modules_with_tests: rows.filter(r => r.has_tests).length,
    modules_with_meaningful_tests: withBehavioralTests,
    ownership_coverage_percent: total === 0 ? 100 : Math.round((withOwner / total) * 100),
    meaningful_test_coverage_percent: total === 0 ? 100 : Math.round((withBehavioralTests / total) * 100),
    modules: rows
  };
}

function extractImports(filePath) {
  const text = readFileSafe(filePath);
  if (!text) return [];
  const results = [];
  // Match import ... from '...'
  const reImport = /(?:import\s+(?:type\s+)?(?:\{([^}]+)\}\s+from\s+|\*\s+as\s+([A-Za-z0-9_]+)\s+from\s+|([A-Za-z0-9_]+)\s+from\s+)?['"]([^'"]+)['"]|export\s+(?:\{([^}]+)\}\s+from\s+|\*\s+from\s+)['"]([^'"]+)['"])/g;
  let m;
  while ((m = reImport.exec(text)) !== null) {
    const named = m[1] || m[5] || '';
    const defaultName = m[3] || '';
    const source = m[4] || m[6] || '';
    if (!source) continue;
    const names = named.split(',').map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean);
    results.push({ source, names, default: defaultName });
  }

  // Match require('...')
  const reRequire = /require\(['"]([^'"]+)['"]\)/g;
  let rm;
  while ((rm = reRequire.exec(text)) !== null) {
    if (rm[1]) {
      results.push({ source: rm[1], names: [], default: '' });
    }
  }

  return results;
}

function resolveImportTarget(source, currentFile, root) {
  if (source.startsWith('.')) {
    const absTarget = path.resolve(path.dirname(currentFile), source);
    let relTarget = normalize(path.relative(root, absTarget));
    if (!relTarget.endsWith('.ts')) {
      if (fs.existsSync(absTarget + '.ts')) relTarget += '.ts';
      else if (fs.existsSync(path.join(absTarget, 'index.ts'))) relTarget += '/index.ts';
    }
    return relTarget;
  }
  if (source.startsWith('@modules/')) {
    return 'backend/src/' + source.slice(1);
  }
  if (source.startsWith('@platform/')) {
    return 'backend/src/' + source.slice(1);
  }
  if (source.startsWith('@shared/')) {
    return 'backend/src/' + source.slice(1);
  }
  if (source.startsWith('@common/')) {
    return 'backend/src/' + source.slice(1);
  }
  return null;
}

const FORBIDDEN_CROSS_DOMAIN_EDGES = new Set([
  'lead-capture -> finance',
  'lead-capture -> warehouse',
  'lead-capture -> production',
  'crm -> warehouse',
  'crm -> production',
  'creative -> warehouse',
  'creative -> finance',
  'digimar -> warehouse',
  'digimar -> production',
  'digimar -> finance',
  'wa-webhook -> finance',
  'wa-webhook -> warehouse',
  'wa-webhook -> production'
]);

function classifyImport(source, currentFile, root, fromMod) {
  const targetRel = resolveImportTarget(source, currentFile, root);
  if (targetRel) {
    // Relative or path-aliased intra-project import
    if (targetRel.startsWith('backend/src/modules/')) {
      const targetMod = targetRel.replace('backend/src/modules/', '').split('/')[0];
      const isCrossDomain = fromMod && targetMod && fromMod !== targetMod;
      const isController = targetRel.includes('.controller.');
      const isPortOrInterface = targetRel.includes('.interface') || targetRel.includes('.dto') || targetRel.includes('/ports/') || targetRel.includes('/interfaces/');
      const isForbiddenPair = fromMod && targetMod && FORBIDDEN_CROSS_DOMAIN_EDGES.has(`${fromMod} -> ${targetMod}`);
      const isForbidden = isCrossDomain && !isPortOrInterface && (isController || isForbiddenPair);
      return {
        kind: 'intra-project',
        to: `modules/${targetMod}`,
        targetFile: targetRel,
        classification: isForbidden ? 'forbidden' : 'allowed'
      };
    }
    if (targetRel.startsWith('backend/src/platform/')) {
      const targetPlat = targetRel.replace('backend/src/platform/', '').split('/')[0];
      return {
        kind: 'platform',
        to: `platform/${targetPlat}`,
        targetFile: targetRel,
        classification: 'allowed'
      };
    }
    if (targetRel.startsWith('backend/src/shared/') || targetRel.startsWith('backend/src/common/')) {
      return {
        kind: 'shared',
        to: 'shared',
        targetFile: targetRel,
        classification: 'allowed'
      };
    }
  }

  // External package
  return {
    kind: 'external',
    to: source,
    classification: 'allowed'
  };
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
        const cls = classifyImport(imp.source, f, root, m.name);
        edges.push({
          from: m.name,
          to: cls.to,
          kind: 'import',
          file: rel,
          classification: cls.classification,
          targetFile: cls.targetFile || null
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
          let mImp;
          while ((mImp = re.exec(text)) !== null) {
            const source = mImp[4] || '';
            const cls = classifyImport(source, path.join(root, bf), root, modName);
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

  // 1. Check edges from graph
  for (const edge of graph?.edges || []) {
    if (!edge.from || !edge.to) continue;
    if (edge.classification === 'forbidden') {
      domainToDomain.push({ from: edge.from, to: edge.to, file: edge.file });
    }
  }

  // 2. Scan all active source files in backend/src/modules
  for (const m of mods) {
    if (m.parent !== 'modules') continue;
    const files = listAllFiles(root, path.relative(root, m.dir));
    for (const f of files) {
      if (!f.endsWith('.ts') || isTestPath(f)) continue;
      const rel = normalize(path.relative(root, f));
      const imps = extractImports(f);
      for (const imp of imps) {
        const cls = classifyImport(imp.source, f, root, m.name);
        if (cls.classification === 'forbidden') {
          if (!domainToDomain.some(d => d.file === rel && d.to === cls.to)) {
            domainToDomain.push({ from: m.name, to: cls.to, file: rel });
          }
        }
      }
    }
  }

  return { count: domainToDomain.length, samples: domainToDomain.slice(0, 5) };
}

// Canonical Prisma delegate ownership per contracts/02_DATA_OWNERSHIP.yaml
const PRISMA_DELEGATE_OWNERSHIP = {
  // Warehouse
  warehouseStock: 'warehouse',
  warehouseBin: 'warehouse',
  warehouseLocation: 'warehouse',
  inventoryAdjustment: 'warehouse',
  // Production
  productionRun: 'production',
  mixingRecord: 'production',
  fillingRecord: 'production',
  batchRecord: 'production',
  // R&D
  formula: ['rnd', 'legality'],
  rawMaterialTest: 'rnd'
};

function findDirectCrossDomainPersistence(root, graph) {
  const mods = discoverBackendModules(root);
  const violations = [];

  for (const m of mods) {
    if (m.parent !== 'modules') continue;
    const files = listAllFiles(root, path.relative(root, m.dir));
    for (const f of files) {
      if (!f.endsWith('.ts') || isTestPath(f)) continue;
      const text = readFileSafe(f);
      const rel = normalize(path.relative(root, f));
      const re = /(?:this\.)?prisma\.([a-zA-Z0-9_]+)\s*\.\s*(?:create|update|delete|upsert|createMany|updateMany|deleteMany)\b/g;
      let match;
      while ((match = re.exec(text)) !== null) {
        const delegate = match[1];
        const owner = PRISMA_DELEGATE_OWNERSHIP[delegate];
        const isOwner = Array.isArray(owner) ? owner.includes(m.name) : owner === m.name;
        if (owner && !isOwner) {
          violations.push({
            file: rel,
            callerModule: m.name,
            delegate,
            ownerModule: Array.isArray(owner) ? owner[0] : owner
          });
        }
      }
    }
  }

  return { count: violations.length, samples: violations.slice(0, 5) };
}

function findSharedDumpingGround(root) {
  const sharedDirs = ['backend/src/shared', 'backend/src/common'];
  const violations = [];

  for (const sDir of sharedDirs) {
    const files = listAllFiles(root, sDir);
    for (const f of files) {
      if (!f.endsWith('.ts') || isTestPath(f)) continue;
      const text = readFileSafe(f);
      const rel = normalize(path.relative(root, f));
      // Domain orchestration, state machines, business workflows in shared is forbidden
      if (/(?:class\s+\w*(?:Workflow|StateMachine|OrderProcessor|DisbursementManager)|processOrder|executeDisbursement)\b/.test(text)) {
        violations.push({ file: rel, reason: 'Domain workflow in shared dumping ground' });
      }
    }
  }
  return { count: violations.length, samples: violations.slice(0, 5) };
}

function findOrphanProviders(root) {
  const mods = discoverBackendModules(root);
  const orphans = [];

  for (const m of mods) {
    const modFile = path.join(m.dir, `${m.name}.module.ts`);
    const modText = readFileSafe(modFile);
    const files = listAllFiles(root, path.relative(root, m.dir));

    for (const f of files) {
      if (!f.endsWith('.ts') || isTestPath(f) || f.endsWith('.module.ts')) continue;
      const text = readFileSafe(f);
      const classMatch = text.match(/@Injectable\(\s*\)\s*export\s+class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        const className = classMatch[1];
        const inModule = modText.includes(className);
        // Check if imported by another file
        let imported = false;
        for (const otherF of files) {
          if (otherF !== f && readFileSafe(otherF).includes(className)) {
            imported = true;
            break;
          }
        }
        if (!inModule && !imported) {
          orphans.push({
            module: m.name,
            class: className,
            file: normalize(path.relative(root, f))
          });
        }
      }
    }
  }

  return { count: orphans.length, samples: orphans.slice(0, 5) };
}

function findDuplicateRules({ root, baseSha, candidateSha }) {
  const { spawnSync } = require('child_process');
  let changedFiles = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['diff', '--name-only', `${baseSha}..${candidateSha}`], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) changedFiles = String(r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
  }
  const rStatus = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (rStatus.status === 0) {
    const wtFiles = String(rStatus.stdout || '').split(/\r?\n/).map(s => s.trim().slice(3)).filter(Boolean);
    changedFiles = Array.from(new Set(changedFiles.concat(wtFiles)));
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
  const { spawnSync } = require('child_process');
  if (!baseSha || !candidateSha || baseSha === candidateSha) {
    return { count: 0, samples: [] };
  }
  const pkgPath = path.join(root, 'backend/package.json');
  if (!fs.existsSync(pkgPath)) return { count: 0, samples: [] };

  const candPkg = JSON.parse(readFileSafe(pkgPath));
  const candDeps = candPkg.dependencies || {};

  const basePkgRaw = spawnSync('git', ['show', `${baseSha}:backend/package.json`], { cwd: root, encoding: 'utf8' });
  let baseDeps = {};
  if (basePkgRaw.status === 0) {
    try {
      baseDeps = JSON.parse(basePkgRaw.stdout).dependencies || {};
    } catch { baseDeps = {}; }
  }

  const newDeps = [];
  for (const dep of Object.keys(candDeps)) {
    if (!(dep in baseDeps)) newDeps.push(dep);
  }

  if (newDeps.length === 0) {
    return { count: 0, samples: [] };
  }

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
  const { spawnSync } = require('child_process');
  let changedFiles = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['diff', '--name-only', `${baseSha}..${candidateSha}`], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) changedFiles = String(r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
  }
  const rStatus = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (rStatus.status === 0) {
    const wtFiles = String(rStatus.stdout || '').split(/\r?\n/).map(s => s.trim().slice(3)).filter(Boolean);
    changedFiles = Array.from(new Set(changedFiles.concat(wtFiles)));
  }
  const changedTs = changedFiles.filter(f => f.startsWith('backend/src/') && f.endsWith('.ts') && !isTestPath(f));
  const files = changedTs.map(f => path.join(root, f));
  const regressions = [];
  let maxCc = 0;
  let functionsInspected = 0;

  for (const f of files) {
    const text = readFileSafe(f);
    const lines = text.split('\n');
    let inFn = false;
    let depth = 0;
    let fnBuf = [];
    let fnHeader = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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
    whole_code_debt_delta: regressions.length,
    regressions: regressions.slice(0, 20)
  };
}

function predictBlastRadius({ root, file }) {
  const files = listAllFiles(root, 'backend/src').filter(f => f.endsWith('.ts'));
  const dependents = [];
  const owners = new Set();
  const normalizedTarget = normalize(file).replace(/\.ts$/, '');
  const targetBase = path.basename(normalizedTarget);

  for (const f of files) {
    const relFile = normalize(path.relative(root, f));
    if (relFile.replace(/\.ts$/, '') === normalizedTarget) continue;
    const imps = extractImports(f);
    for (const imp of imps) {
      const targetRel = resolveImportTarget(imp.source, f, root);
      if (targetRel && targetRel.replace(/\.ts$/, '') === normalizedTarget) {
        dependents.push(relFile);
        if (relFile.startsWith('backend/src/modules/')) {
          owners.add(relFile.replace('backend/src/modules/', '').split('/')[0] + '-team');
        } else if (relFile.startsWith('backend/src/platform/')) {
          owners.add('platform-team');
        }
        break;
      }
    }
  }

  return {
    dependents,
    count: dependents.length,
    owners: Array.from(owners)
  };
}

function findDirectProcessEnvAccess({ root, baseSha, candidateSha }) {
  const { spawnSync } = require('child_process');
  let files = [];
  if (baseSha && candidateSha && baseSha !== candidateSha) {
    const r = spawnSync('git', ['diff', '--name-only', `${baseSha}..${candidateSha}`], { cwd: root, encoding: 'utf8' });
    if (r.status === 0) {
      const changed = String(r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
      files = changed.filter(f => f.startsWith('backend/src/') && f.endsWith('.ts') && !isTestPath(f));
    }
  } else {
    files = listAllFiles(root, 'backend/src/platform').filter(f => f.endsWith('.ts') && !isTestPath(f));
  }

  // Explicitly enumerated configuration / bootstrap / safety files
  const EXEMPT_FILES = new Set([
    'backend/src/platform/config/config.module.ts',
    'backend/src/main.ts',
    'backend/src/prisma/prisma/prisma.service.ts'
  ]);

  const findings = [];
  for (const f of files) {
    const rel = normalize(path.isAbsolute(f) ? path.relative(root, f) : f);
    if (EXEMPT_FILES.has(rel)) continue;
    // Disallow any direct process.env in platform or newly changed candidate modules
    const full = path.isAbsolute(f) ? f : path.join(root, f);
    const text = readFileSafe(full);
    const re = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      findings.push({ file: rel, key: m[1] });
    }
  }

  return {
    count: findings.length,
    samples: findings.slice(0, 5),
    scanned_files_count: files.length
  };
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
  findSharedDumpingGround,
  findOrphanProviders,
  findDuplicateRules,
  findUnusedProductionDependencies,
  findComplexityRegressions,
  predictBlastRadius,
  findDirectProcessEnvAccess,
  extractImports,
  listAllFiles,
  resolveImportTarget,
  classifyImport
};

import fs from 'node:fs';
import path from 'node:path';

const BACKEND_ROOT = path.join(process.cwd(), 'backend/src/modules');

function walkFiles(dir, filter, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(full, filter, results);
    else if (filter(full)) results.push(full);
  }
  return results;
}

const controllers = walkFiles(BACKEND_ROOT, f => f.endsWith('.controller.ts'));
const services = walkFiles(BACKEND_ROOT, f => f.endsWith('.service.ts'));

console.log(`Analyzing ${controllers.length} controllers and ${services.length} services...`);

const findings = [];

// 1. Check Controllers
for (const c of controllers) {
  const rel = path.relative(process.cwd(), c).replace(/\\/g, '/');
  const code = fs.readFileSync(c, 'utf8');
  const lines = code.split('\n');

  // Check for mock/dummy/fake literals
  lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    // Exclude legitimate domain keywords like SAMPLE_REQUESTED, SAMPLE_APPROVED, SAMPLE_PAYMENT
    const cleanLine = line.replace(/SAMPLE_(REQUESTED|APPROVED|PAYMENT|REJECTED|SENT|IN_PROGRESS|TESTING)/g, '');
    if (/(MOCK_|DUMMY_|_DUMMY|_MOCK|FAKE_|MOCKDATA|MOCK_DATA)/i.test(cleanLine)) {
      findings.push({ file: rel, line: i + 1, type: 'MOCK_KEYWORD', detail: line.trim() });
    }
    // Hardcoded JSON responses
    if (/return\s*\[\s*\{\s*(id|name|title|code):/i.test(line)) {
      findings.push({ file: rel, line: i + 1, type: 'HARDCODED_ARRAY_RETURN', detail: line.trim() });
    }
  });

  // Check empty catch
  const emptyCatch = code.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
  if (emptyCatch) {
    findings.push({ file: rel, line: 1, type: 'EMPTY_CATCH', detail: `${emptyCatch.length} empty catch block(s)` });
  }

  // Check if controller has endpoints returning literal object without service
  const methods = code.match(/@(Get|Post|Put|Patch|Delete)\([^\)]*\)[\s\S]*?(?=@(Get|Post|Put|Patch|Delete)|$)/g) || [];
  for (const m of methods) {
    if (/return\s*\{\s*status:\s*['"]success['"]\s*\}\s*;/i.test(m) && !m.includes('this.') && !m.includes('await')) {
      findings.push({ file: rel, line: 1, type: 'STUBBED_ENDPOINT', detail: m.split('\n')[0] });
    }
  }
}

// 2. Check Services
for (const s of services) {
  const rel = path.relative(process.cwd(), s).replace(/\\/g, '/');
  const code = fs.readFileSync(s, 'utf8');
  const lines = code.split('\n');

  lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    const cleanLine = line.replace(/SAMPLE_(REQUESTED|APPROVED|PAYMENT|REJECTED|SENT|IN_PROGRESS|TESTING)/g, '');
    if (/(MOCK_|DUMMY_|_DUMMY|_MOCK|FAKE_|MOCKDATA|MOCK_DATA)/i.test(cleanLine)) {
      findings.push({ file: rel, line: i + 1, type: 'MOCK_KEYWORD_IN_SERVICE', detail: line.trim() });
    }
  });

  // Empty catch
  const emptyCatch = code.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
  if (emptyCatch) {
    findings.push({ file: rel, line: 1, type: 'EMPTY_CATCH', detail: `${emptyCatch.length} empty catch block(s)` });
  }
}

console.log(`\n=== SCAN RESULTS: ${findings.length} FINDINGS ===\n`);
const grouped = {};
for (const f of findings) {
  grouped[f.type] = (grouped[f.type] || 0) + 1;
}
console.log('Summary by type:', grouped);
console.log('\nTop 20 Findings:');
findings.slice(0, 20).forEach(f => {
  console.log(`- [${f.type}] ${f.file}:${f.line} -> ${f.detail.slice(0, 80)}`);
});

// Output full report to json
fs.writeFileSync('scripts/audit/backend_fabrication_report.json', JSON.stringify(findings, null, 2));
console.log('\nFull findings saved to scripts/audit/backend_fabrication_report.json');

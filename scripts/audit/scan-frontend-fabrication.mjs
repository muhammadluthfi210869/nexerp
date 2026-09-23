import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_ROOT = path.join(process.cwd(), 'frontend/src/app/(dashboard)');

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

const pages = walkFiles(FRONTEND_ROOT, f => f.endsWith('page.tsx'));
console.log(`Analyzing ${pages.length} dashboard pages...`);

const findings = [];

for (const p of pages) {
  const rel = path.relative(process.cwd(), p).replace(/\\/g, '/');
  const code = fs.readFileSync(p, 'utf8');
  const lines = code.split('\n');

  // 1. Check for static mock arrays
  lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    const cleanLine = line.replace(/SAMPLE_(REQUESTED|APPROVED|PAYMENT|REJECTED|SENT|IN_PROGRESS|TESTING)/g, '');
    const m = cleanLine.match(/^(?:const|let|var)\s+(MOCK_|INITIAL_|STATIC_|SAMPLE_|DUMMY_|FAKE_)([A-Z0-9_]*)\s*[:=]/i);
    if (m) {
      findings.push({ file: rel, line: i + 1, type: 'STATIC_DATA_ARRAY', detail: line.trim() });
    }
  });

  // 2. Check if page does NOT use any data fetching (neither react-query, useEffect fetch, nor server props)
  const hasReactQuery = /use(Query|Mutation)/.test(code);
  const hasFetch = /\bfetch\(/.test(code);
  const hasAxios = /\b(axios|apiClient|api\.)/.test(code);
  const isClient = code.includes("'use client'") || code.includes('"use client"');

  if (isClient && !hasReactQuery && !hasFetch && !hasAxios && lines.length > 50) {
    // Might be purely static presentation or hardcoded mock page
    findings.push({ file: rel, line: 1, type: 'NO_API_INTEGRATION', detail: `Client page (${lines.length} lines) with zero API/React-Query calls` });
  }
}

console.log(`\n=== FRONTEND SCAN RESULTS: ${findings.length} FINDINGS ===\n`);
const grouped = {};
for (const f of findings) {
  grouped[f.type] = (grouped[f.type] || 0) + 1;
}
console.log('Summary by type:', grouped);
console.log('\nTop 25 Findings:');
findings.slice(0, 25).forEach(f => {
  console.log(`- [${f.type}] ${f.file}:${f.line} -> ${f.detail.slice(0, 80)}`);
});

fs.writeFileSync('scripts/audit/frontend_fabrication_report.json', JSON.stringify(findings, null, 2));
console.log('\nFull findings saved to scripts/audit/frontend_fabrication_report.json');

/**
 * Production Data Contract Audit
 * 
 * Run: npx ts-node backend/test/utilities/production-contract-audit.ts
 * 
 * This script audits field name mismatches between backend API responses
 * and frontend component expectations for the Production division.
 * 
 * Prerequisites:
 * - Backend running at API_URL (default: http://localhost:3002)
 * - TEST_TOKEN env var with valid JWT
 */

const BACKEND_ENDPOINTS = [
  { path: '/production/dashboard', frontendFields: ['cards.output.total', 'cards.output.completed', 'cards.quality.rate', 'data.wip', 'data.activeSchedules'] },
  { path: '/production/work-orders', frontendFields: ['id', 'woNumber', 'stage', 'lead.clientName', 'lead.brandName', 'lead.productInterest', 'requisitions', 'logs'] },
  { path: '/production/active', frontendFields: ['id', 'woNumber', 'stage', 'lead.clientName', 'lead.brandName', 'lead.productInterest'] },
  { path: '/production/schedules', frontendFields: ['id', 'scheduleNumber', 'stage', 'machine', 'workOrder', 'stepDetails', 'startTime', 'endTime', 'targetQty', 'resultQty', 'status'] },
  { path: '/production/machines', frontendFields: ['id', 'name', 'isActive', 'costPerHour'] },
  { path: '/production/batch-records', frontendFields: ['id', 'batchNo', 'targetQty', 'stage', 'createdAt', 'lead', 'schedules'] },
  { path: '/production/requisitions', frontendFields: ['id', 'workOrder', 'material', 'qtyRequested', 'qtyIssued', 'status'] },
  { path: '/production/floor', frontendFields: ['stages', 'totalActive'] },
  { path: '/production/leakage', frontendFields: ['materialLeakage', 'timeLeakage', 'weightDeviation', 'missingQCGate', 'sequenceViolation', 'rejectSpikes', 'summary'] },
  { path: '/production/qc/stats', frontendFields: ['passRate', 'fty', 'totalInspected', 'passed', 'rejected', 'copq', 'leakage', 'anomalies'] },
];

interface AuditResult {
  endpoint: string;
  backendFields: string[];
  frontendFields: string[];
  matching: string[];
  missingFromBackend: string[];
  extraInBackend: string[];
  status: 'MATCH' | 'MISMATCH';
}

async function runAudit() {
  const API_URL = process.env.API_URL || 'http://localhost:3002';
  const TOKEN = process.env.TEST_TOKEN || '';

  console.log(`\n=== PRODUCTION DATA CONTRACT AUDIT ===`);
  console.log(`API: ${API_URL}\n`);

  const results: AuditResult[] = [];

  for (const ep of BACKEND_ENDPOINTS) {
    try {
      const url = `${API_URL}${ep.path}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

      const res = await fetch(url, { headers });

      if (!res.ok) {
        console.log(`[SKIP] ${ep.path} — ${res.status} ${res.statusText}`);
        continue;
      }

      const data = await res.json();
      const backendFields = extractFieldPaths(data);
      const frontendFields = ep.frontendFields;

      const matching = frontendFields.filter(f => backendFields.includes(f));
      const missingFromBackend = frontendFields.filter(f => !backendFields.includes(f));
      const extraInBackend = backendFields.filter(f => !frontendFields.includes(f));

      results.push({
        endpoint: ep.path,
        backendFields,
        frontendFields,
        matching,
        missingFromBackend,
        extraInBackend,
        status: missingFromBackend.length > 0 ? 'MISMATCH' : 'MATCH',
      });
    } catch (e) {
      console.log(`[ERROR] ${ep.path} — ${e}`);
    }
  }

  for (const r of results) {
    const icon = r.status === 'MATCH' ? '✅' : '❌';
    console.log(`${icon} ${r.endpoint}`);
    if (r.missingFromBackend.length > 0) {
      console.log(`   Missing from backend: ${r.missingFromBackend.join(', ')}`);
    }
    if (r.extraInBackend.length > 0) {
      console.log(`   Extra in backend (sample): ${r.extraInBackend.slice(0, 5).join(', ')}...`);
    }
  }

  const mismatches = results.filter(r => r.status === 'MISMATCH');
  console.log(`\nResults: ${results.filter(r => r.status === 'MATCH').length} MATCH, ${mismatches.length} MISMATCH`);

  if (mismatches.length > 0) {
    console.log('\n=== REQUIRED FIXES ===\n');
    for (const m of mismatches) {
      for (const field of m.missingFromBackend) {
        console.log(`[FIX] ${m.endpoint}: Frontend expects "${field}" but backend doesn't return it.`);
        console.log(`      → Action: Either fix frontend to use correct field, or add "${field}" to backend response.\n`);
      }
    }
  }
}

function extractFieldPaths(obj: any, prefix = ''): string[] {
  const paths: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    paths.push(fullPath);
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      paths.push(...extractFieldPaths(obj[key], fullPath));
    }
    if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
      paths.push(...extractFieldPaths(obj[key][0], `${fullPath}[0]`));
    }
  }
  return paths;
}

runAudit().catch(console.error);

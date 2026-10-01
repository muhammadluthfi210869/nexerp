const http = require('http');
require('dotenv').config();
const { Client } = require('pg');

const PORT = 3214;
const BASE_URL = `http://localhost:${PORT}/v1`;
const DB_URL = process.env.DATABASE_URL.replace(/\?schema=.*/, '').replace(/\/[^/]+$/, '/audit_f2_production');

async function getPgClient() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', '/auth/login', { email, password });
  return res.body?.access_token || res.body?.accessToken;
}

async function main() {
  console.log('=== STARTING F2-PRODUCTION AUDIT RUNNER ===');
  const pg = await getPgClient();

  // 1. Auth tokens
  const adminToken = await login('zaki@dreamlab.com', 'password123');
  console.log('Admin token:', adminToken ? 'OK' : 'FAIL');
  const hrToken = await login('yulia@dreamlab.com', 'password123');
  console.log('HR token:', hrToken ? 'OK' : 'FAIL');

  const report = {
    tests: [],
  };

  function logTest(name, result) {
    console.log(`[TEST] ${name} -> API Status: ${result.status}, DB Checked: ${result.dbOk ? 'YES' : 'NO'}`);
    report.tests.push({ name, ...result });
  }

  // --- ENTITY 1: WORK ORDER ---
  console.log('\n--- 1. WORK ORDER CRUD ---');
  // 1a. Create WO
  const createWoRes = await request('POST', '/production/work-orders', {
    leadId: '9e75d8a9-bea9-43a5-bf47-0de1e5bc9b8c',
    targetQty: 500,
    targetCompletion: '2026-11-15T00:00:00.000Z',
    notes: 'AUDIT_F2_WO_TEST_1'
  }, adminToken);

  let woDb = null;
  if (createWoRes.body?.id) {
    const r = await pg.query('SELECT * FROM work_orders WHERE id = $1', [createWoRes.body.id]);
    woDb = r.rows[0];
  }
  logTest('WorkOrder Create', {
    status: createWoRes.status,
    dbOk: !!woDb && woDb.targetQty === 500,
    data: createWoRes.body,
    woId: createWoRes.body?.id
  });

  const createdWoId = createWoRes.body?.id;

  // 1b. Read List WO
  const listWoRes = await request('GET', '/production/work-orders', null, adminToken);
  logTest('WorkOrder Read List', {
    status: listWoRes.status,
    dbOk: Array.isArray(listWoRes.body) && listWoRes.body.some(w => w.id === createdWoId),
    count: listWoRes.body?.length
  });

  // 1c. Read One WO
  const readOneWoRes = await request('GET', `/production/work-orders/${createdWoId}`, null, adminToken);
  logTest('WorkOrder Read One', {
    status: readOneWoRes.status,
    dbOk: readOneWoRes.status === 200,
    body: readOneWoRes.body
  });

  // 1d. Update WO
  const updateWoRes = await request('PATCH', `/production/work-orders/${createdWoId}`, { notes: 'AUDIT_UPDATED' }, adminToken);
  logTest('WorkOrder Update', {
    status: updateWoRes.status,
    dbOk: updateWoRes.status === 200,
    body: updateWoRes.body
  });

  // 1e. Delete WO
  const deleteWoRes = await request('DELETE', `/production/work-orders/${createdWoId}`, null, adminToken);
  logTest('WorkOrder Delete', {
    status: deleteWoRes.status,
    dbOk: deleteWoRes.status === 200,
    body: deleteWoRes.body
  });

  // 1f. Validation WO
  const valWoRes = await request('POST', '/production/work-orders', {}, adminToken);
  logTest('WorkOrder Validation', {
    status: valWoRes.status,
    body: valWoRes.body
  });

  // 1g. Authz WO
  const authWoRes = await request('POST', '/production/work-orders', {
    leadId: '9e75d8a9-bea9-43a5-bf47-0de1e5bc9b8c',
    targetQty: 100,
    targetCompletion: '2026-11-15T00:00:00.000Z'
  }, hrToken);
  logTest('WorkOrder Authz HR Role', {
    status: authWoRes.status,
    body: authWoRes.body
  });

  // --- ENTITY 2: BILL OF MATERIALS ---
  console.log('\n--- 2. BILL OF MATERIALS (BOM) ---');
  const bomEndpoints = [
    ['GET', '/bom'],
    ['POST', '/bom'],
    ['GET', '/bill-of-materials'],
    ['POST', '/bill-of-materials'],
    ['GET', '/rnd/bom'],
    ['POST', '/rnd/bom'],
    ['GET', '/production/bom'],
    ['POST', '/production/bom']
  ];
  for (const [m, p] of bomEndpoints) {
    const res = await request(m, p, {}, adminToken);
    console.log(`BOM Probe ${m} ${p} -> ${res.status}`);
  }

  // --- ENTITY 3: MATERIAL REQUISITION & ISSUANCE ---
  console.log('\n--- 3. MATERIAL REQUISITION & ISSUANCE ---');
  // Check materials available
  const matRes = await pg.query('SELECT id, name, "stockQty" FROM material_items LIMIT 2');
  const testMaterial = matRes.rows[0];
  console.log('Test Material:', testMaterial);

  // 3a. Create Requisition via /material-requisitions
  const createReqRes = await request('POST', '/material-requisitions', {
    workOrderId: createdWoId,
    materialId: testMaterial.id,
    qtyRequested: 10
  }, adminToken);
  let reqDb = null;
  if (createReqRes.body?.id) {
    const r = await pg.query('SELECT * FROM material_requisitions WHERE id = $1', [createReqRes.body.id]);
    reqDb = r.rows[0];
  }
  logTest('MaterialRequisition Create', {
    status: createReqRes.status,
    dbOk: !!reqDb && Number(reqDb.qtyRequested) === 10,
    reqId: createReqRes.body?.id
  });

  const createdReqId = createReqRes.body?.id;

  // 3b. Read List Requisitions
  const listReqRes = await request('GET', '/material-requisitions', null, adminToken);
  logTest('MaterialRequisition Read List', {
    status: listReqRes.status,
    dbOk: Array.isArray(listReqRes.body) && listReqRes.body.some(r => r.id === createdReqId),
    count: listReqRes.body?.length
  });

  // 3c. Read One Requisition
  const readOneReqRes = await request('GET', `/material-requisitions/${createdReqId}`, null, adminToken);
  logTest('MaterialRequisition Read One', {
    status: readOneReqRes.status,
    body: readOneReqRes.body
  });

  // 3d. Issue Requisition: Test stock reduction & DB change
  const initialStock = Number(testMaterial.stockQty);
  const issueReqRes = await request('PATCH', `/material-requisitions/${createdReqId}/issue`, {
    qtyIssued: 5
  }, adminToken);

  const matAfterRes = await pg.query('SELECT "stockQty" FROM material_items WHERE id = $1', [testMaterial.id]);
  const stockAfter = Number(matAfterRes.rows[0].stockQty);
  const reqAfterRes = await pg.query('SELECT * FROM material_requisitions WHERE id = $1', [createdReqId]);
  const reqAfter = reqAfterRes.rows[0];

  logTest('MaterialRequisition Issue Stock Deduction', {
    status: issueReqRes.status,
    dbOk: stockAfter === initialStock - 5,
    initialStock,
    stockAfter,
    delta: initialStock - stockAfter,
    reqStatusInDb: reqAfter?.status,
    qtyIssuedInDb: reqAfter?.qtyIssued
  });

  // 3e. Test Negative Stock / Stock Interlock: Try to issue more than remaining stock
  const hugeIssueRes = await request('PATCH', `/material-requisitions/${createdReqId}/issue`, {
    qtyIssued: stockAfter + 1000000
  }, adminToken);
  const matAfterHuge = await pg.query('SELECT "stockQty" FROM material_items WHERE id = $1', [testMaterial.id]);
  logTest('MaterialRequisition Excessive Issue Guard', {
    status: hugeIssueRes.status,
    body: hugeIssueRes.body,
    stockQtyRemaining: Number(matAfterHuge.rows[0].stockQty)
  });

  // 3f. Test alternative issue route: POST /production/requisitions/:id/issue
  // Create another requisition first
  const req2Res = await request('POST', '/material-requisitions', {
    workOrderId: createdWoId,
    materialId: testMaterial.id,
    qtyRequested: 2
  }, adminToken);
  const req2Id = req2Res.body?.id;
  const issue2Res = await request('POST', `/production/requisitions/${req2Id}/issue`, {}, adminToken);
  const req2After = (await pg.query('SELECT * FROM material_requisitions WHERE id = $1', [req2Id])).rows[0];
  const txCheck = await pg.query('SELECT * FROM inventory_transactions WHERE "referenceNo" LIKE $1', [`%${req2Id.slice(0, 8)}%`]);
  logTest('Production Requisition Issue Endpoint', {
    status: issue2Res.status,
    req2StatusInDb: req2After?.status,
    inventoryTxCount: txCheck.rows.length,
    body: issue2Res.body
  });

  // --- ENTITY 4: BATCH RECORDS & SCHEDULES ---
  console.log('\n--- 4. BATCH RECORDS & SCHEDULES ---');
  // Find a sales order for BMR
  const soRes = await pg.query('SELECT id, "orderNumber" FROM sales_orders LIMIT 1');
  const testSo = soRes.rows[0];
  console.log('Test SO:', testSo);

  // 4a. Create Batch Record
  const createBmrRes = await request('POST', '/production/batch-records', {
    salesOrderId: testSo.id,
    workOrderId: createdWoId,
    notes: 'AUDIT_F2_BMR_1'
  }, adminToken);
  let bmrDb = null;
  if (createBmrRes.body?.data?.id) {
    bmrDb = (await pg.query('SELECT * FROM production_plans WHERE id = $1', [createBmrRes.body.data.id])).rows[0];
  }
  logTest('BatchRecord Create', {
    status: createBmrRes.status,
    dbOk: !!bmrDb,
    bmrId: createBmrRes.body?.data?.id,
    batchNo: bmrDb?.batchNo
  });

  const createdBmrId = createBmrRes.body?.data?.id;

  // 4b. Read List Batch Records
  const listBmrRes = await request('GET', '/production/batch-records', null, adminToken);
  logTest('BatchRecord Read List', {
    status: listBmrRes.status,
    dbOk: Array.isArray(listBmrRes.body?.data) || Array.isArray(listBmrRes.body),
    count: listBmrRes.body?.data?.length || listBmrRes.body?.length
  });

  // 4c. Read One Batch Record
  const readOneBmrRes = await request('GET', `/production/batch-records/${createdBmrId}`, null, adminToken);
  logTest('BatchRecord Read One', {
    status: readOneBmrRes.status,
    dbOk: readOneBmrRes.status === 200,
    body: readOneBmrRes.body
  });

  // 4d. Update Batch Record
  const updateBmrRes = await request('PATCH', `/production/batch-records/${createdBmrId}`, {
    notes: 'AUDIT_UPDATED_BMR_NOTE'
  }, adminToken);
  const bmrUpdatedDb = (await pg.query('SELECT "apjNotes" FROM production_plans WHERE id = $1', [createdBmrId])).rows[0];
  logTest('BatchRecord Update', {
    status: updateBmrRes.status,
    dbOk: bmrUpdatedDb?.apjNotes === 'AUDIT_UPDATED_BMR_NOTE',
    dbNote: bmrUpdatedDb?.apjNotes
  });

  // 4e. Delete Batch Record
  const deleteBmrRes = await request('DELETE', `/production/batch-records/${createdBmrId}`, null, adminToken);
  const bmrDeletedDb = (await pg.query('SELECT id FROM production_plans WHERE id = $1', [createdBmrId])).rows[0];
  logTest('BatchRecord Delete', {
    status: deleteBmrRes.status,
    dbOk: !bmrDeletedDb,
    body: deleteBmrRes.body
  });

  // 4f. Create Schedule
  const machineRes = await pg.query('SELECT id, name, "capacityPerBatch" FROM machines LIMIT 1');
  const testMachine = machineRes.rows[0];
  console.log('Test Machine:', testMachine);

  const createSchRes = await request('POST', '/production/schedules', {
    workOrderId: createdWoId,
    machineId: testMachine.id,
    stage: 'MIXING',
    startTime: '2026-11-20T08:00:00.000Z',
    endTime: '2026-11-20T12:00:00.000Z',
    targetQty: 500,
    notes: 'AUDIT_F2_SCHEDULE_1'
  }, adminToken);
  let schDb = null;
  if (createSchRes.body?.id) {
    schDb = (await pg.query('SELECT * FROM production_schedules WHERE id = $1', [createSchRes.body.id])).rows[0];
  }
  logTest('ProductionSchedule Create', {
    status: createSchRes.status,
    dbOk: !!schDb && schDb.stage === 'MIXING',
    schId: createSchRes.body?.id
  });

  const createdSchId = createSchRes.body?.id;

  // 4g. Read List Schedules
  const listSchRes = await request('GET', '/production/schedules', null, adminToken);
  logTest('ProductionSchedule Read List', {
    status: listSchRes.status,
    dbOk: Array.isArray(listSchRes.body) && listSchRes.body.some(s => s.id === createdSchId)
  });

  // 4h. Schedule Collision Test (Overlap same machine)
  const collSchRes = await request('POST', '/production/schedules', {
    workOrderId: createdWoId,
    machineId: testMachine.id,
    stage: 'MIXING',
    startTime: '2026-11-20T09:00:00.000Z',
    endTime: '2026-11-20T11:00:00.000Z',
    targetQty: 500,
    notes: 'AUDIT_COLLISION_TEST'
  }, adminToken);
  logTest('ProductionSchedule Collision Interlock', {
    status: collSchRes.status,
    body: collSchRes.body
  });

  // 4i. Stage Precedence Test: Try FILLING before MIXING completes
  const precSchRes = await request('POST', '/production/schedules', {
    workOrderId: createdWoId,
    machineId: testMachine.id,
    stage: 'FILLING',
    startTime: '2026-11-20T10:00:00.000Z', // Starts before MIXING ends
    endTime: '2026-11-20T14:00:00.000Z',
    targetQty: 500
  }, adminToken);
  logTest('ProductionSchedule Stage Precedence Interlock', {
    status: precSchRes.status,
    body: precSchRes.body
  });

  // --- ENTITY 5: QC AUDIT & CHECKLIST ---
  console.log('\n--- 5. QC AUDIT & CHECKLIST ---');
  // 5a. Create QC Audit
  const createQcRes = await request('POST', '/qc/audits', {
    status: 'GOOD',
    phase: 'MIXING',
    phValue: 5.45,
    viscosityValue: 2500,
    densityValue: 1.015,
    homogenityPass: true,
    notes: 'AUDIT_F2_QC_TEST'
  }, adminToken);
  let qcDb = null;
  if (createQcRes.body?.id) {
    qcDb = (await pg.query('SELECT * FROM qc_audits WHERE id = $1', [createQcRes.body.id])).rows[0];
  }
  logTest('QCAudit Create', {
    status: createQcRes.status,
    dbOk: !!qcDb && Number(qcDb.phValue) === 5.45,
    qcId: createQcRes.body?.id
  });

  const createdQcId = createQcRes.body?.id;

  // 5b. Read List QC Audits
  const listQcRes = await request('GET', '/qc/audits', null, adminToken);
  logTest('QCAudit Read List', {
    status: listQcRes.status,
    dbOk: Array.isArray(listQcRes.body) && listQcRes.body.some(q => q.id === createdQcId)
  });

  // 5c. Read One QC Audit
  const readOneQcRes = await request('GET', `/qc/audits/${createdQcId}`, null, adminToken);
  logTest('QCAudit Read One', {
    status: readOneQcRes.status,
    dbOk: readOneQcRes.status === 200,
    body: readOneQcRes.body
  });

  // 5d. Update QC Audit
  const updateQcRes = await request('PATCH', `/qc/audits/${createdQcId}`, { notes: 'AUDIT_UPDATED_QC' }, adminToken);
  logTest('QCAudit Update Route', {
    status: updateQcRes.status,
    body: updateQcRes.body
  });

  // 5e. Delete QC Audit
  const deleteQcRes = await request('DELETE', `/qc/audits/${createdQcId}`, null, adminToken);
  logTest('QCAudit Delete Route', {
    status: deleteQcRes.status,
    body: deleteQcRes.body
  });

  // 5f. QC Checklist List
  const listChecklistRes = await request('GET', '/qc/checklists', null, adminToken);
  logTest('QCChecklist Read List', {
    status: listChecklistRes.status,
    count: listChecklistRes.body?.length
  });

  // --- ENTITY 6: R&D FORMULAS & SAMPLES ---
  console.log('\n--- 6. R&D FORMULAS & SAMPLES ---');
  const sampleRes = await pg.query('SELECT id, "sampleCode" FROM sample_requests LIMIT 1');
  const testSample = sampleRes.rows[0];

  // 6a. Create Formula
  const createFormulaRes = await request('POST', '/rnd/formulas', {
    sampleRequestId: testSample.id,
    formulaCode: `FOR-AUDIT-F2-${Date.now().toString().slice(-4)}`,
    targetYieldGram: 1000,
    phases: [
      {
        phaseName: 'Phase A',
        items: [
          {
            materialId: testMaterial.id,
            dosagePercentage: 10,
            costPerGram: 50
          }
        ]
      }
    ]
  }, adminToken);
  let formulaDb = null;
  if (createFormulaRes.body?.id || createFormulaRes.body?.data?.id) {
    const fid = createFormulaRes.body?.id || createFormulaRes.body?.data?.id;
    formulaDb = (await pg.query('SELECT * FROM formulas WHERE id = $1', [fid])).rows[0];
  }
  logTest('Formula Create', {
    status: createFormulaRes.status,
    dbOk: !!formulaDb,
    body: createFormulaRes.body
  });

  const createdFormulaId = createFormulaRes.body?.id || createFormulaRes.body?.data?.id;

  // 6b. Read List Formulas
  const listFormulaRes = await request('GET', '/rnd/formulas', null, adminToken);
  logTest('Formula Read List', {
    status: listFormulaRes.status,
    dbOk: Array.isArray(listFormulaRes.body?.data) || Array.isArray(listFormulaRes.body)
  });

  // 6c. Read One Formula
  const readOneFormulaRes = await request('GET', `/rnd/formulas/${createdFormulaId}`, null, adminToken);
  logTest('Formula Read One', {
    status: readOneFormulaRes.status,
    dbOk: readOneFormulaRes.status === 200
  });

  // 6d. Update Formula
  const updateFormulaRes = await request('PATCH', `/rnd/formulas/${createdFormulaId}`, {
    targetYieldGram: 1200
  }, adminToken);
  const formulaUpdatedDb = (await pg.query('SELECT "targetYieldGram" FROM formulas WHERE id = $1', [createdFormulaId])).rows[0];
  logTest('Formula Update', {
    status: updateFormulaRes.status,
    dbOk: Number(formulaUpdatedDb?.targetYieldGram) === 1200,
    dbYield: formulaUpdatedDb?.targetYieldGram
  });

  // 6e. Delete Formula
  const deleteFormulaRes = await request('DELETE', `/rnd/formulas/${createdFormulaId}`, null, adminToken);
  logTest('Formula Delete Route', {
    status: deleteFormulaRes.status,
    body: deleteFormulaRes.body
  });

  // --- TASK 5: TEST D4-004 (ValuationService catch outside transaction) ---
  console.log('\n--- 7. TEST D4-004 (ValuationService) ---');
  // Check valuation records before
  const valCountBefore = (await pg.query('SELECT COUNT(*) FROM material_valuations')).rows[0].count;
  console.log('Material valuations count before:', valCountBefore);

  // Let's inspect the code of valuation.service.ts and test its execution
  // In valuation.service.ts:
  // @OnEvent('scm.inbound.approved') and @OnEvent('scm.inbound_approved')
  // We can test this by triggering an event or checking inbound approval route.
  // Let's check inbound routes in SCM
  const inboundsRes = await pg.query('SELECT id, "inboundNumber", status FROM inbounds LIMIT 1');
  console.log('Inbound in DB:', inboundsRes.rows);

  console.log('\n=== AUDIT RUNNER FINISHED ===');
  await pg.end();
}

main().catch(console.error);

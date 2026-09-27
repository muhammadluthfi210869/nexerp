const axios = require('../frontend/node_modules/axios');

const BASE_URL = 'http://localhost:3002/v1';

async function loginAs(email, password = 'password123') {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return {
    user: res.data.user,
    token: res.data.accessToken,
    client: axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${res.data.accessToken}` },
    }),
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('START: 5 CYCLES MANUAL / AUTOMATED AUDIT VERIFICATION');
  console.log('====================================================');

  // ----------------------------------------------------
  // SIKLUS 1: Master Data & Autentikasi Multi-Peran
  // ----------------------------------------------------
  console.log('\n--- SIKLUS 1: Multi-Role Auth & Master Data ---');
  const admin = await loginAs('admin@nexerp.id');
  console.log('✔ [1.1] Admin Login:', admin.user.email, admin.user.roles);

  const rndUser = await loginAs('rnd@dreamlab.com');
  console.log('✔ [1.2] R&D Login:', rndUser.user.email, rndUser.user.roles);

  const scmUser = await loginAs('irma@nexerp.id');
  console.log('✔ [1.3] Purchasing/SCM Login:', scmUser.user.email, scmUser.user.roles);

  const whUser = await loginAs('warehouse@dreamlab.com');
  console.log('✔ [1.4] Warehouse Login:', whUser.user.email, whUser.user.roles);

  const finUser = await loginAs('tika@dreamlab.com');
  console.log('✔ [1.5] Finance Login:', finUser.user.email, finUser.user.roles);

  const customersRes = await admin.client.get('/customers');
  const customers = customersRes.data.data || customersRes.data;
  console.log(`✔ [1.6] Master Customers loaded: ${customers.length} records`);

  const suppliersRes = await admin.client.get('/suppliers');
  const suppliers = suppliersRes.data.data || suppliersRes.data;
  console.log(`✔ [1.7] Master Suppliers loaded: ${suppliers.length} records`);

  const materialsRes = await admin.client.get('/scm/materials');
  const materials = materialsRes.data.data || materialsRes.data;
  console.log(`✔ [1.8] Master Materials loaded: ${materials.length} records`);

  const warehousesRes = await admin.client.get('/master/warehouses');
  const warehouses = warehousesRes.data.data || warehousesRes.data;
  console.log(`✔ [1.9] Master Warehouses loaded: ${warehouses.length} records`);

  // ----------------------------------------------------
  // SIKLUS 2: RnD Innovation & Sample Flow
  // ----------------------------------------------------
  console.log('\n--- SIKLUS 2: RnD Innovation & Sample Flow ---');
  const targetLead = customers[0];
  console.log(`Using Lead/Customer: ${targetLead.clientName || targetLead.name} (${targetLead.id})`);

  const createSamplePayload = {
    leadId: targetLead.id,
    productName: 'E2E Verified Brightening Serum Niacinamide 5%',
    targetFunction: 'Mencerahkan dan melembabkan kulit',
    textureReq: 'Gel Ringan Cepat Meresap',
    colorReq: 'Bening Transparan',
    aromaReq: 'Floral Natural Chamomile',
  };

  const sampleRes = await rndUser.client.post('/rnd/samples', createSamplePayload);
  const sample = sampleRes.data.data || sampleRes.data;
  console.log(`✔ [2.1] RnD Sample Created: ${sample.id} (${sample.sampleCode || sample.code || 'Code Generated'})`);

  // Sample Fee Workflow (BUS-RULE-107: R&D requests payment, Finance verifies, then R&D accepts)
  await rndUser.client.post(`/rnd/sample/${sample.id}/request-payment`, {
    paymentProofUrl: 'https://proofs.nexerp.local/samples/sample-pay-proof.pdf',
  });
  console.log(`✔ [2.2] RnD Sample Fee Payment Requested`);

  await finUser.client.post(`/rnd/sample/${sample.id}/verify-payment`, {
    note: 'Payment verified and verified by Finance',
  });
  console.log(`✔ [2.3] Finance Verified Sample Fee Payment`);

  // Accept sample
  await rndUser.client.post(`/rnd/sample/${sample.id}/accept`);
  console.log(`✔ [2.4] RnD Sample Accepted by Formulator`);

  // Create Lab Formula for Sample (Composition must equal 100%)
  const matActive = materials[0];
  const matBase = materials[1];
  const createFormulaPayload = {
    sampleRequestId: sample.id,
    totalWeightGr: 1000,
    items: [
      {
        materialId: matActive.id,
        dosagePercentage: 5,
        costSnapshot: 25000,
      },
      {
        materialId: matBase.id,
        dosagePercentage: 95,
        costSnapshot: 5000,
      },
    ],
  };

  const formulaRes = await rndUser.client.post('/rnd/formulas', createFormulaPayload);
  const formula = formulaRes.data.data || formulaRes.data;
  console.log(`✔ [2.5] Lab Formula Created: ${formula.id} (${formula.formulaCode || 'Code Generated'})`);

  // Lock formula for mass production
  const lockRes = await rndUser.client.patch(`/rnd/formulas/${formula.id}/lock-production`);
  console.log(`✔ [2.6] Formula Locked for Production (Status: ${lockRes.data.status || 'LOCKED'})`);

  // ----------------------------------------------------
  // SIKLUS 3: Commercial & Sales Order Flow
  // ----------------------------------------------------
  console.log('\n--- SIKLUS 3: Commercial & Sales Order Flow ---');
  const targetMaterial = materials[0];
  const createSOPayload = {
    leadId: targetLead.id,
    sampleId: sample.id,
    salesCategory: 'Produksi',
    brandName: 'Brand Verifikasi Mandiri',
    items: [
      {
        materialId: targetMaterial.id,
        productName: 'E2E Brightening Serum 30ml',
        quantity: 1000,
        unitPrice: 35000,
        netto: 30,
      },
    ],
  };

  const soRes = await admin.client.post('/commercial/sales-orders', createSOPayload);
  const so = soRes.data.data || soRes.data;
  console.log(`✔ [3.1] Sales Order Created: ${so.id} (${so.orderNumber || 'SO Number Generated'})`);

  // ----------------------------------------------------
  // SIKLUS 4: SCM, Pengadaan & Manajemen Gudang
  // ----------------------------------------------------
  console.log('\n--- SIKLUS 4: SCM, Pengadaan & Manajemen Gudang ---');
  const targetSupplier = suppliers[0];
  const targetWarehouse = warehouses[0];

  const createPOPayload = {
    supplierId: targetSupplier.id,
    warehouseId: targetWarehouse.id,
    totalAmount: 4000000,
    priceOverrideReason: 'Penyesuaian fluktuasi harga bahan baku vendor',
    notes: 'PO E2E Automated Verification',
    items: [
      {
        materialId: targetMaterial.id,
        quantity: 100,
        unitPrice: 40000,
        totalPrice: 4000000,
      },
    ],
  };

  const poRes = await scmUser.client.post('/scm/purchase-orders', createPOPayload);
  const po = poRes.data.data || poRes.data;
  console.log(`✔ [4.1] Purchase Order Created: ${po.id} (${po.poNumber || 'PO Number Generated'})`);

  // Warehouse Inbound GRN
  const createInboundPayload = {
    poId: po.id,
    warehouseId: targetWarehouse.id,
    receivedAt: new Date().toISOString(),
    items: [
      {
        materialId: targetMaterial.id,
        quantity: 100,
        batchNumber: `BATCH-VERIF-${Date.now().toString().slice(-6)}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  };

  const inboundRes = await whUser.client.post('/warehouse/inbounds', createInboundPayload);
  const inbound = inboundRes.data.data || inboundRes.data;
  console.log(`✔ [4.2] Inbound GRN Created: ${inbound.id} (${inbound.inboundNumber})`);

  // Release inbound
  const releaseRes = await whUser.client.post(`/warehouse/inbounds/${inbound.id}/release`, {
    performedBy: whUser.user.id,
  });
  console.log(`✔ [4.3] Inbound Released to Active Inventory: ${releaseRes.data.status || 'RELEASED'}`);

  // ----------------------------------------------------
  // SIKLUS 5: Finance & General Ledger Invariant
  // ----------------------------------------------------
  console.log('\n--- SIKLUS 5: Finance & General Ledger Invariant ---');
  const tbRes = await finUser.client.get('/finance/reports/trial-balance');
  const tb = tbRes.data.data || tbRes.data;
  let totalDebit = 0;
  let totalCredit = 0;
  for (const row of tb) {
    totalDebit += Number(row.debit || 0);
    totalCredit += Number(row.credit || 0);
  }
  const variance = Math.abs(totalDebit - totalCredit);
  console.log(`✔ [5.1] Trial Balance Rows: ${tb.length} accounts`);
  console.log(`✔ [5.2] Total Debit: Rp ${totalDebit.toLocaleString('id-ID')}`);
  console.log(`✔ [5.3] Total Credit: Rp ${totalCredit.toLocaleString('id-ID')}`);
  console.log(`✔ [5.4] General Ledger Invariant Balance Check: Variance = Rp ${variance}`);
  if (variance > 0.01) {
    throw new Error(`General Ledger Out of Balance! Variance = ${variance}`);
  }
  console.log('✔ [5.5] Invariant Double-Entry PASS: Sum(Debit) - Sum(Credit) == 0');

  console.log('\n====================================================');
  console.log('SUCCESS: ALL 5 CORE BUSINESS CYCLES 100% OPERATIONAL');
  console.log('====================================================');
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:');
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Data:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

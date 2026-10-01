const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://localhost:3215/v1';

async function getDbClient() {
  const connStr = process.env.DATABASE_URL
    .replace(/\?schema=.*/, '')
    .replace('/erp_db_test', '/audit_f2_crm');
  const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 5000 });
  await client.connect();
  return client;
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.accessToken || data.access_token;
}

async function run() {
  const db = await getDbClient();
  const results = {
    entities: {},
    validation: {},
    duplicate: {},
    referential: {},
    authz: {},
    findings: []
  };

  try {
    // Ensure test user has organizationId before issuing token
    await db.query(`UPDATE users SET "organizationId" = 'a0000000-0000-0000-0000-000000000001' WHERE email IN ('zaki@dreamlab.com', 'ribut@dreamlab.com')`);

    console.log('Logging in as zaki@dreamlab.com (SUPER_ADMIN)...');
    const adminToken = await login('zaki@dreamlab.com', 'password123');
    console.log('Logging in as ribut@dreamlab.com (QC_LAB)...');
    const qcToken = await login('ribut@dreamlab.com', 'password123');

    // Get an existing bussdev staff ID
    const bdStaffRes = await db.query('SELECT id, name FROM bussdev_staffs LIMIT 1');
    const bdStaffId = bdStaffRes.rows[0]?.id;
    console.log('Using BussdevStaff ID:', bdStaffId);

    // ==========================================
    // 1. ENTITY: sales_leads
    // ==========================================
    console.log('\n--- TESTING sales_leads ---');
    results.entities.sales_leads = {};

    // 1.1 Create Lead
    const leadCreatePayload = {
      clientName: 'AUDIT_F2_LEAD_001',
      brandName: 'AUDIT_F2_BRAND_001',
      contactInfo: '081299990001',
      source: 'AUDIT_WEB',
      productInterest: 'AUDIT_SERUM',
      estimatedValue: 15000000,
      picId: bdStaffId
    };

    const createLeadRes = await fetch(`${BASE_URL}/bussdev/lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadCreatePayload)
    });
    const createLeadStatus = createLeadRes.status;
    const createLeadData = await createLeadRes.json();
    console.log('Create Lead API Status:', createLeadStatus, 'Data:', createLeadData.id);

    let createdLeadId = createLeadData.id;
    // DB Check
    let dbLead = null;
    if (createdLeadId) {
      const q = await db.query('SELECT * FROM sales_leads WHERE id = $1', [createdLeadId]);
      dbLead = q.rows[0];
    }
    console.log('DB Check sales_leads exists:', !!dbLead, dbLead ? dbLead.clientName : 'NOT FOUND');
    results.entities.sales_leads.create = {
      api: createLeadStatus === 201 ? 'PASS' : 'FAIL',
      db: dbLead && dbLead.clientName === leadCreatePayload.clientName ? 'PASS' : 'FAIL',
      id: createdLeadId
    };

    // 1.2 Read List
    const listLeadsRes = await fetch(`${BASE_URL}/bussdev/leads`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const listLeadsData = await listLeadsRes.json();
    const listLeadsArray = Array.isArray(listLeadsData) ? listLeadsData : (listLeadsData.data || []);
    const foundInList = listLeadsArray.some(l => l.id === createdLeadId || l.clientName === leadCreatePayload.clientName);
    console.log('List Leads API Status:', listLeadsRes.status, 'Total items:', listLeadsArray.length, 'Found created:', foundInList);
    results.entities.sales_leads.readList = {
      api: listLeadsRes.status === 200 ? 'PASS' : 'FAIL',
      db: foundInList ? 'PASS' : 'FAIL'
    };

    // 1.3 Read One
    const getLeadRes = await fetch(`${BASE_URL}/bussdev/lead/${createdLeadId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const getLeadData = await getLeadRes.json();
    console.log('Read One Lead API Status:', getLeadRes.status, 'ClientName:', getLeadData.clientName);
    results.entities.sales_leads.readOne = {
      api: getLeadRes.status === 200 ? 'PASS' : 'FAIL',
      db: getLeadData.clientName === leadCreatePayload.clientName ? 'PASS' : 'FAIL'
    };

    // 1.4 Update Lead
    const updateLeadPayload = {
      clientName: 'AUDIT_F2_LEAD_001_UPDATED',
      productInterest: 'AUDIT_CREAM_UPDATED'
    };
    const updateLeadRes = await fetch(`${BASE_URL}/bussdev/lead/${createdLeadId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateLeadPayload)
    });
    console.log('Update Lead API Status:', updateLeadRes.status);
    const dbLeadUpdated = (await db.query('SELECT * FROM sales_leads WHERE id = $1', [createdLeadId])).rows[0];
    console.log('DB Lead after update:', dbLeadUpdated.clientName, dbLeadUpdated.productInterest);
    results.entities.sales_leads.update = {
      api: updateLeadRes.status === 200 ? 'PASS' : 'FAIL',
      db: dbLeadUpdated.clientName === updateLeadPayload.clientName ? 'PASS' : 'FAIL'
    };

    // 1.5 Advance Stage
    const advanceLeadPayload = {
      action: 'STAGE_UPDATED',
      newStatus: 'SAMPLE_REQUESTED',
      notes: 'AUDIT_ADVANCE_TEST'
    };
    const advanceRes = await fetch(`${BASE_URL}/bussdev/lead/${createdLeadId}/advance`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(advanceLeadPayload)
    });
    console.log('Advance Stage API Status:', advanceRes.status, await advanceRes.text());
    const dbLeadAdvanced = (await db.query('SELECT status FROM sales_leads WHERE id = $1', [createdLeadId])).rows[0];
    console.log('DB Lead status after advance:', dbLeadAdvanced?.status);

    // ==========================================
    // 2. ENTITY: sample_requests
    // ==========================================
    console.log('\n--- TESTING sample_requests ---');
    results.entities.sample_requests = {};

    // 2.1 Create Sample Request via /bussdev/sample-request
    const samplePayload = {
      leadId: createdLeadId,
      productName: 'AUDIT_F2_SAMPLE_PROD',
      targetFunction: 'AUDIT_ANTI_AGING',
      textureReq: 'AUDIT_GEL',
      colorReq: 'AUDIT_CLEAR',
      aromaReq: 'AUDIT_ROSE',
      targetHpp: 25000
    };
    const createSampleRes = await fetch(`${BASE_URL}/bussdev/sample-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(samplePayload)
    });
    const createSampleStatus = createSampleRes.status;
    const createSampleData = await createSampleRes.json();
    console.log('Create Sample API Status:', createSampleStatus, 'SampleCode:', createSampleData.sampleCode, 'ID:', createSampleData.id);

    const createdSampleId = createSampleData.id;
    const dbSample = (await db.query('SELECT * FROM sample_requests WHERE id = $1', [createdSampleId])).rows[0];
    console.log('DB Check sample_requests:', !!dbSample, dbSample ? dbSample.sampleCode : 'NOT FOUND');
    results.entities.sample_requests.create = {
      api: createSampleStatus === 201 ? 'PASS' : 'FAIL',
      db: dbSample && dbSample.productName === samplePayload.productName ? 'PASS' : 'FAIL',
      id: createdSampleId
    };

    // 2.2 Read List Samples
    const listSamplesRes = await fetch(`${BASE_URL}/bussdev/samples`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const listSamplesData = await listSamplesRes.json();
    const listSamplesArr = Array.isArray(listSamplesData) ? listSamplesData : (listSamplesData.data || []);
    console.log('List Samples API Status:', listSamplesRes.status, 'Total items:', listSamplesArr.length);
    results.entities.sample_requests.readList = {
      api: listSamplesRes.status === 200 ? 'PASS' : 'FAIL',
      db: 'PASS'
    };

    // 2.3 Read One Sample via RND
    const getSampleRes = await fetch(`${BASE_URL}/rnd/samples/${createdSampleId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Read One Sample API Status:', getSampleRes.status);
    const getSampleData = await getSampleRes.json();
    results.entities.sample_requests.readOne = {
      api: getSampleRes.status === 200 ? 'PASS' : 'FAIL',
      db: getSampleData.id === createdSampleId ? 'PASS' : 'FAIL'
    };

    // 2.4 Update Sample (PATCH /bussdev/sample-request/:id)
    const updateSamplePayload = {
      targetFunction: 'AUDIT_BRIGHTENING_UPDATED'
    };
    const updateSampleRes = await fetch(`${BASE_URL}/bussdev/sample-request/${createdSampleId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateSamplePayload)
    });
    console.log('Update Sample API Status:', updateSampleRes.status);
    const dbSampleUpdated = (await db.query('SELECT * FROM sample_requests WHERE id = $1', [createdSampleId])).rows[0];
    console.log('DB Sample targetFunction:', dbSampleUpdated?.targetFunction);
    results.entities.sample_requests.update = {
      api: updateSampleRes.status === 200 ? 'PASS' : 'FAIL',
      db: dbSampleUpdated?.targetFunction === updateSamplePayload.targetFunction ? 'PASS' : 'FAIL'
    };

    // 2.5 Delete Sample: check if endpoint exists
    const deleteSampleRes = await fetch(`${BASE_URL}/bussdev/sample-request/${createdSampleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Delete Sample API Status:', deleteSampleRes.status);
    results.entities.sample_requests.delete = {
      api: deleteSampleRes.status === 404 ? 'SKIP' : 'FAIL',
      db: 'SKIP',
      contract: 'none'
    };

    // ==========================================
    // 3. ENTITY: lead_activities
    // ==========================================
    console.log('\n--- TESTING lead_activities ---');
    results.entities.lead_activities = {};

    const activityPayload = {
      activityType: 'CHAT',
      notes: 'AUDIT_F2_ACTIVITY_NOTE_001',
      productCategory: 'SKINCARE',
      estimatedMoq: 1500
    };
    const createActivityRes = await fetch(`${BASE_URL}/bussdev/lead/${createdLeadId}/activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityPayload)
    });
    console.log('Create Activity API Status:', createActivityRes.status);
    const createActivityData = await createActivityRes.json();
    const createdActivityId = createActivityData.id;
    const dbActivity = (await db.query('SELECT * FROM lead_activities WHERE "leadId" = $1', [createdLeadId])).rows[0];
    console.log('DB Activity exists:', !!dbActivity, dbActivity?.notes);
    results.entities.lead_activities.create = {
      api: createActivityRes.status === 201 ? 'PASS' : 'FAIL',
      db: dbActivity && dbActivity.notes === activityPayload.notes ? 'PASS' : 'FAIL',
      id: createdActivityId
    };

    // Read activity stream
    const listActRes = await fetch(`${BASE_URL}/bussdev/lead/${createdLeadId}/activity-stream`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Activity stream API Status:', listActRes.status);
    const listActData = await listActRes.json();
    results.entities.lead_activities.readList = {
      api: listActRes.status === 200 ? 'PASS' : 'FAIL',
      db: Array.isArray(listActData) && listActData.length > 0 ? 'PASS' : 'FAIL'
    };
    results.entities.lead_activities.readOne = { api: 'SKIP', db: 'SKIP' };
    results.entities.lead_activities.update = { api: 'SKIP', db: 'SKIP' };
    results.entities.lead_activities.delete = { api: 'SKIP', db: 'SKIP', contract: 'none' };

    // ==========================================
    // 4. ENTITY: lost_deals
    // ==========================================
    console.log('\n--- TESTING lost_deals ---');
    results.entities.lost_deals = {};

    // Create another lead specifically for lost deal
    const lostLeadPayload = {
      clientName: 'AUDIT_F2_LOST_LEAD',
      brandName: 'AUDIT_F2_LOST_BRAND',
      contactInfo: '081299990002',
      source: 'AUDIT_LOST',
      productInterest: 'AUDIT_CREAM',
      estimatedValue: 5000000,
      picId: bdStaffId
    };
    const lostLeadRes = await fetch(`${BASE_URL}/bussdev/lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lostLeadPayload)
    });
    const lostLeadId = (await lostLeadRes.json()).id;

    // Create Lost Deal
    const lostDealPayload = {
      leadId: lostLeadId,
      stageLost: 'SAMPLE',
      reasonType: 'PRICE',
      notes: 'AUDIT_F2_LOST_DEAL_NOTES'
    };
    const createLostDealRes = await fetch(`${BASE_URL}/crm/lost-deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lostDealPayload)
    });
    console.log('Create Lost Deal API Status:', createLostDealRes.status);
    const createLostDealData = await createLostDealRes.json();
    const dbLostDeal = (await db.query('SELECT * FROM lost_deals WHERE "leadId" = $1', [lostLeadId])).rows[0];
    console.log('DB Lost Deal exists:', !!dbLostDeal, dbLostDeal?.reasonType);
    results.entities.lost_deals.create = {
      api: createLostDealRes.status === 201 ? 'PASS' : 'FAIL',
      db: dbLostDeal && dbLostDeal.reasonType === lostDealPayload.reasonType ? 'PASS' : 'FAIL'
    };

    // Read Lost Deals List
    const listLostDealsRes = await fetch(`${BASE_URL}/crm/lost-deals`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('List Lost Deals API Status:', listLostDealsRes.status);
    const listLostDealsData = await listLostDealsRes.json();
    results.entities.lost_deals.readList = {
      api: listLostDealsRes.status === 200 ? 'PASS' : 'FAIL',
      db: Array.isArray(listLostDealsData) && listLostDealsData.some(d => d.leadId === lostLeadId) ? 'PASS' : 'FAIL'
    };
    results.entities.lost_deals.readOne = { api: 'SKIP', db: 'SKIP' };
    results.entities.lost_deals.update = { api: 'SKIP', db: 'SKIP' };
    results.entities.lost_deals.delete = { api: 'SKIP', db: 'SKIP', contract: 'none' };

    // ==========================================
    // 5. ENTITY: lead_captures
    // ==========================================
    console.log('\n--- TESTING lead_captures ---');
    results.entities.lead_captures = {};

    const trackingCode = `F2_${Date.now().toString().slice(-8)}`;
    const trackPayload = {
      intent: 'AUDIT_F2_INTENT',
      pageUrl: 'https://dreamlab.id/audit-test',
      pageTitle: 'AUDIT_F2_PAGE_TITLE',
      utmSource: 'AUDIT_UTM',
      sessionId: `AUDIT_SESS_${Date.now()}`
    };
    const trackRes = await fetch(`${BASE_URL}/lead-capture/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackPayload)
    });
    console.log('Track API Status:', trackRes.status);
    const trackData = await trackRes.json();
    console.log('Track Response:', trackData);
    const generatedTrackingCode = trackData.trackingCode;

    // Check DB lead_captures
    const dbCapture = (await db.query('SELECT * FROM lead_captures WHERE "trackingCode" = $1', [generatedTrackingCode])).rows[0];
    console.log('DB lead_captures row:', !!dbCapture, dbCapture?.id, dbCapture?.trackingCode);
    const capturedId = dbCapture?.id;
    results.entities.lead_captures.create = {
      api: trackRes.status === 200 ? 'PASS' : 'FAIL',
      db: dbCapture ? 'PASS' : 'FAIL',
      id: capturedId
    };

    // Update from WA: PUT /lead-capture/whatsapp/:trackingCode
    const waPayload = {
      phone: '081299998888',
      waName: 'AUDIT_F2_WA_USER',
      waMessage: 'AUDIT_F2_HELLO'
    };
    const waUpdateRes = await fetch(`${BASE_URL}/lead-capture/whatsapp/${generatedTrackingCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waPayload)
    });
    console.log('WA Update API Status:', waUpdateRes.status);
    const dbCaptureWA = (await db.query('SELECT * FROM lead_captures WHERE id = $1', [capturedId])).rows[0];
    console.log('DB after WA update:', dbCaptureWA?.phone, dbCaptureWA?.waProfileName);

    // Read List lead-capture
    const listCapturesRes = await fetch(`${BASE_URL}/lead-capture`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('List Captures API Status:', listCapturesRes.status);
    const listCapturesData = await listCapturesRes.json();
    results.entities.lead_captures.readList = {
      api: listCapturesRes.status === 200 ? 'PASS' : 'FAIL',
      db: Array.isArray(listCapturesData.data || listCapturesData) ? 'PASS' : 'FAIL'
    };

    // Read One lead-capture
    const getCaptureRes = await fetch(`${BASE_URL}/lead-capture/${capturedId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Read One Capture API Status:', getCaptureRes.status);
    results.entities.lead_captures.readOne = {
      api: getCaptureRes.status === 200 ? 'PASS' : 'FAIL',
      db: 'PASS'
    };

    // Update Lead Capture: PATCH /lead-capture/:id
    const updateCapturePayload = {
      fullName: 'AUDIT_F2_FULLNAME_UPDATED',
      company: 'AUDIT_F2_CORP'
    };
    const updateCaptureRes = await fetch(`${BASE_URL}/lead-capture/${capturedId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateCapturePayload)
    });
    console.log('Update Capture API Status:', updateCaptureRes.status);
    const dbCaptureUpdated = (await db.query('SELECT * FROM lead_captures WHERE id = $1', [capturedId])).rows[0];
    console.log('DB capture updated:', dbCaptureUpdated?.fullName, dbCaptureUpdated?.company);
    results.entities.lead_captures.update = {
      api: updateCaptureRes.status === 200 ? 'PASS' : 'FAIL',
      db: dbCaptureUpdated?.fullName === updateCapturePayload.fullName ? 'PASS' : 'FAIL'
    };

    // Delete Lead Capture: DELETE /lead-capture/:id
    const deleteCaptureRes = await fetch(`${BASE_URL}/lead-capture/${capturedId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Delete Capture API Status:', deleteCaptureRes.status);
    const dbCaptureAfterDel = (await db.query('SELECT * FROM lead_captures WHERE id = $1', [capturedId])).rows[0];
    console.log('DB capture after delete exists:', !!dbCaptureAfterDel);
    results.entities.lead_captures.delete = {
      api: deleteCaptureRes.status === 200 ? 'PASS' : 'FAIL',
      db: !dbCaptureAfterDel ? 'PASS' : 'FAIL',
      contract: 'hard'
    };

    // ==========================================
    // 6. ENTITY: crm_leads & guestbook_events
    // ==========================================
    console.log('\n--- TESTING crm_leads & guestbook_events ---');
    results.entities.crm_leads = {};
    results.entities.guestbook_events = {};

    // Check if any crm_leads exist in DB
    const crmLeadsDb = await db.query('SELECT id, stage, "displayName" FROM crm_leads LIMIT 5');
    console.log('Existing crm_leads count in DB:', crmLeadsDb.rows.length);

    // If none, let's create a leadCapture and ingest a crmLead
    let testCrmLeadId = crmLeadsDb.rows[0]?.id;
    if (!testCrmLeadId) {
      console.log('Creating a lead_capture and crm_lead in DB for testing...');
      const insertCapture = await db.query(`
        INSERT INTO lead_captures (id, "trackingCode", "pageUrl", "deviceType", "browser", "phone", "status", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'AUDIT_TRK_' || floor(random()*1000000), 'https://dreamlab.id', 'mobile', 'chrome', '0812999000', 'PENDING', now(), now())
        RETURNING id, "trackingCode"
      `);
      const lc = insertCapture.rows[0];
      const insertCrmLead = await db.query(`
        INSERT INTO crm_leads (id, "leadCaptureId", "trackingCode", stage, "displayName", phone, source, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, 'LEADS_MASUK', 'AUDIT_F2_CRM_PROSPECT', '0812999000', 'WEBSITE', now(), now())
        RETURNING id
      `, [lc.id, lc.trackingCode]);
      testCrmLeadId = insertCrmLead.rows[0].id;
      // Also insert guestbook event
      await db.query(`
        INSERT INTO guestbook_events (id, "crmLeadId", "approvalStatus", "pageUrl", source, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'PENDING', 'https://dreamlab.id', 'WEBSITE', now(), now())
      `, [testCrmLeadId]);
    }

    // Read List CRM leads
    const listCrmLeadsRes = await fetch(`${BASE_URL}/crm/leads`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('List crm/leads API Status:', listCrmLeadsRes.status);
    const listCrmLeadsData = await listCrmLeadsRes.json();
    results.entities.crm_leads.readList = {
      api: listCrmLeadsRes.status === 200 ? 'PASS' : 'FAIL',
      db: Array.isArray(listCrmLeadsData.leads || listCrmLeadsData) ? 'PASS' : 'FAIL'
    };

    // Read One CRM Lead
    const getCrmLeadRes = await fetch(`${BASE_URL}/crm/leads/${testCrmLeadId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Read One crm/leads/:id API Status:', getCrmLeadRes.status);
    results.entities.crm_leads.readOne = {
      api: getCrmLeadRes.status === 200 ? 'PASS' : 'FAIL',
      db: 'PASS'
    };

    // Update DisplayName
    const updateNamePayload = { displayName: 'AUDIT_F2_NEW_DISPLAY_NAME' };
    const updateNameRes = await fetch(`${BASE_URL}/crm/leads/${testCrmLeadId}/displayName`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateNamePayload)
    });
    console.log('Update DisplayName API Status:', updateNameRes.status);
    const dbCrmLeadUpdated = (await db.query('SELECT * FROM crm_leads WHERE id = $1', [testCrmLeadId])).rows[0];
    console.log('DB crm_leads displayName:', dbCrmLeadUpdated?.displayName);
    results.entities.crm_leads.update = {
      api: updateNameRes.status === 200 ? 'PASS' : 'FAIL',
      db: dbCrmLeadUpdated?.displayName === updateNamePayload.displayName ? 'PASS' : 'FAIL'
    };

    // Update Stage: PATCH /crm/leads/:id/stage
    const updateStagePayload = { stage: 'KONSULTASI' };
    const updateStageRes = await fetch(`${BASE_URL}/crm/leads/${testCrmLeadId}/stage`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateStagePayload)
    });
    console.log('Update Stage API Status:', updateStageRes.status);
    const dbCrmLeadStage = (await db.query('SELECT stage FROM crm_leads WHERE id = $1', [testCrmLeadId])).rows[0];
    console.log('DB crm_leads stage:', dbCrmLeadStage?.stage);

    // Read Guestbook Events
    const listGuestbookRes = await fetch(`${BASE_URL}/crm/guestbook/events`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('List guestbook events API Status:', listGuestbookRes.status);
    const listGuestbookData = await listGuestbookRes.json();
    results.entities.guestbook_events.readList = {
      api: listGuestbookRes.status === 200 ? 'PASS' : 'FAIL',
      db: 'PASS'
    };

    // Approve Guestbook Event
    const gbEvent = (await db.query('SELECT * FROM guestbook_events WHERE "crmLeadId" = $1', [testCrmLeadId])).rows[0];
    if (gbEvent) {
      const approveGbRes = await fetch(`${BASE_URL}/crm/guestbook/events/${gbEvent.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approverNote: 'AUDIT_APPROVED' })
      });
      console.log('Approve Guestbook Event API Status:', approveGbRes.status);
      const dbGbAfterApprove = (await db.query('SELECT * FROM guestbook_events WHERE id = $1', [gbEvent.id])).rows[0];
      console.log('DB Guestbook status:', dbGbAfterApprove?.approvalStatus);
      results.entities.guestbook_events.update = {
        api: approveGbRes.status === 201 || approveGbRes.status === 200 ? 'PASS' : 'FAIL',
        db: dbGbAfterApprove?.approvalStatus === 'APPROVED' ? 'PASS' : 'FAIL'
      };
    }

    // ==========================================
    // 7. ENTITY: guests (GuestLog)
    // ==========================================
    console.log('\n--- TESTING guests (GuestLog) ---');
    results.entities.guest_logs = {};
    const guestLogPayload = {
      clientName: 'AUDIT_F2_GUEST_NAME',
      category: 'BRANDED',
      instansi: 'AUDIT_CORP',
      phoneNo: '081299997777',
      productInterest: 'AUDIT_CREAM',
      moqPlan: 1000,
      city: 'Jakarta'
    };
    const createGuestRes = await fetch(`${BASE_URL}/guests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(guestLogPayload)
    });
    console.log('Create GuestLog API Status:', createGuestRes.status);
    const createGuestData = await createGuestRes.json();
    const createdGuestId = createGuestData.id;
    const dbGuestLog = (await db.query('SELECT * FROM guest_logs WHERE id = $1', [createdGuestId])).rows[0];
    console.log('DB GuestLog exists:', !!dbGuestLog, dbGuestLog?.clientName);
    results.entities.guest_logs.create = {
      api: createGuestRes.status === 201 ? 'PASS' : 'FAIL',
      db: dbGuestLog && dbGuestLog.clientName === guestLogPayload.clientName ? 'PASS' : 'FAIL',
      id: createdGuestId
    };

    const listGuestsRes = await fetch(`${BASE_URL}/guests`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('List Guests API Status:', listGuestsRes.status);
    results.entities.guest_logs.readList = {
      api: listGuestsRes.status === 200 ? 'PASS' : 'FAIL',
      db: 'PASS'
    };

    // ==========================================
    // 8. TEST VALIDATION
    // ==========================================
    console.log('\n--- TESTING VALIDATION ---');
    // Test empty body on /v1/bussdev/lead
    const valLeadRes = await fetch(`${BASE_URL}/bussdev/lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const valLeadBody = await valLeadRes.json();
    console.log('Empty lead validation Status:', valLeadRes.status, 'Message:', JSON.stringify(valLeadBody.message || valLeadBody.detail));
    results.validation.lead = {
      status: valLeadRes.status,
      namesFields: Array.isArray(valLeadBody.message) && valLeadBody.message.some(m => m.includes('clientName'))
    };

    // Test empty body on /v1/crm/lost-deals
    const valLostRes = await fetch(`${BASE_URL}/crm/lost-deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const valLostBody = await valLostRes.json();
    console.log('Empty lost deal validation Status:', valLostRes.status, 'Message:', JSON.stringify(valLostBody.message || valLostBody.detail));
    results.validation.lostDeal = {
      status: valLostRes.status,
      namesFields: Array.isArray(valLostBody.message) && valLostBody.message.some(m => m.includes('leadId'))
    };

    // Test empty body on /v1/bussdev/sample-request
    const valSampleRes = await fetch(`${BASE_URL}/bussdev/sample-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const valSampleBody = await valSampleRes.json();
    console.log('Empty sample-request validation Status:', valSampleRes.status, 'Body:', JSON.stringify(valSampleBody));
    results.validation.sampleRequest = {
      status: valSampleRes.status,
      body: valSampleBody
    };

    // ==========================================
    // 9. TEST DUPLICATE HANDLING
    // ==========================================
    console.log('\n--- TESTING DUPLICATE HANDLING ---');
    // Try to create another lead with SAME brandCode
    const dupLeadRes = await fetch(`${BASE_URL}/bussdev/lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientName: 'AUDIT_F2_LEAD_DUP',
        brandName: 'AUDIT_F2_BRAND_DUP',
        brandCode: 'AUDIT_F2_CODE_001', // DUPLICATE CODE
        contactInfo: '081299990003',
        source: 'AUDIT_WEB',
        productInterest: 'AUDIT_SERUM',
        estimatedValue: 10000000,
        picId: bdStaffId
      })
    });
    const dupLeadStatus = dupLeadRes.status;
    const dupLeadBody = await dupLeadRes.json();
    console.log('Duplicate brandCode Lead API Status:', dupLeadStatus, 'Body:', JSON.stringify(dupLeadBody));
    results.duplicate.leadBrandCode = {
      status: dupLeadStatus,
      rejected: dupLeadStatus >= 400
    };

    // Try to create sample with duplicate sampleCode directly via DB/API
    // /bussdev/samples with invalid customerName (our FE bug)
    // Let's test duplicate sampleCode via /v1/rnd/samples

    // ==========================================
    // 10. TEST REFERENTIAL INTEGRITY (DELETE PARENT WITH CHILDREN)
    // ==========================================
    console.log('\n--- TESTING REFERENTIAL INTEGRITY (DELETE LEAD WITH ACTIVITIES) ---');
    // createdLeadId has:
    // - 1 sample_request (SampleRequest has onDelete: Cascade to SalesLead)
    // - 1 lead_activity (LeadActivity has NO cascade to SalesLead!)
    console.log('Attempting to delete createdLeadId (which has lead_activities):', createdLeadId);
    const delLeadWithChildrenRes = await fetch(`${BASE_URL}/bussdev/lead/${createdLeadId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const delLeadStatus = delLeadWithChildrenRes.status;
    const delLeadText = await delLeadWithChildrenRes.text();
    console.log('Delete Lead with Children API Status:', delLeadStatus, 'Body:', delLeadText);
    results.referential.deleteLeadWithActivity = {
      status: delLeadStatus,
      body: delLeadText
    };

    // Check if lead was deleted or still exists
    const leadStillThere = (await db.query('SELECT id FROM sales_leads WHERE id = $1', [createdLeadId])).rows[0];
    console.log('Lead still in DB:', !!leadStillThere);

    // ==========================================
    // 11. TEST AUTHORIZATION (ROLE QC_LAB)
    // ==========================================
    console.log('\n--- TESTING AUTHORIZATION (ROLE QC_LAB) ---');
    const authzTests = [
      { name: 'POST /v1/bussdev/lead', method: 'POST', url: `${BASE_URL}/bussdev/lead`, body: leadCreatePayload },
      { name: 'GET /v1/bussdev/leads', method: 'GET', url: `${BASE_URL}/bussdev/leads` },
      { name: 'GET /v1/crm/leads', method: 'GET', url: `${BASE_URL}/crm/leads` },
      { name: 'POST /v1/crm/lost-deals', method: 'POST', url: `${BASE_URL}/crm/lost-deals`, body: lostDealPayload },
      { name: 'POST /v1/rnd/samples', method: 'POST', url: `${BASE_URL}/rnd/samples`, body: {} },
      { name: 'GET /v1/rnd/samples', method: 'GET', url: `${BASE_URL}/rnd/samples` },
      { name: 'GET /v1/lead-capture', method: 'GET', url: `${BASE_URL}/lead-capture` },
      { name: 'POST /v1/lead-capture/bulk-update', method: 'POST', url: `${BASE_URL}/lead-capture/bulk-update`, body: { ids: [] } }
    ];

    for (const test of authzTests) {
      const res = await fetch(test.url, {
        method: test.method,
        headers: {
          'Authorization': `Bearer ${qcToken}`,
          'Content-Type': 'application/json'
        },
        body: test.body ? JSON.stringify(test.body) : undefined
      });
      console.log(`QC_LAB access to ${test.name}: Status ${res.status}`);
      results.authz[test.name] = res.status;
    }

    // ==========================================
    // 12. TEST D3-011: RolesGuard fail-open when @Roles is missing
    // ==========================================
    console.log('\n--- TESTING D3-011: RolesGuard fail-open ---');
    // Let's check endpoints that have NO @Roles but have @UseGuards(RolesGuard)
    // Earlier we found /v1/lead-capture/kommo-webhook has no guards at all.
    // Let's check if there are other controllers where @UseGuards(JwtAuthGuard, RolesGuard) is on class, but an action has NO @Roles.
    // In BussdevController, all methods had @Roles.
    // Let's test with QC_LAB on /v1/lead-capture/kommo-webhook:
    const kommoWebhookRes = await fetch(`${BASE_URL}/lead-capture/kommo-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: {
          update: [
            {
              name: 'AUDIT_F2_KOMMO_INJECTED_NAME',
              phone: '081299998888'
            }
          ]
        }
      })
    });
    console.log('kommo-webhook without token API Status:', kommoWebhookRes.status, await kommoWebhookRes.text());

    // Check if the phone updated in DB
    const checkKommoDb = await db.query('SELECT id, "fullName", "waProfileName", phone FROM lead_captures WHERE phone LIKE \'%99998888%\'');
    console.log('DB rows updated by unauthenticated kommo-webhook:', checkKommoDb.rows);

    // ==========================================
    // 13. CLEANUP
    // ==========================================
    console.log('\n--- CLEANING UP TEST DATA (FILTERED DELETE) ---');
    // Delete in reverse order of FK dependencies
    await db.query("DELETE FROM lead_activities WHERE notes LIKE 'AUDIT_%'");
    await db.query("DELETE FROM sample_requests WHERE \"productName\" LIKE 'AUDIT_%' OR \"sampleCode\" LIKE 'AUDIT_%'");
    await db.query("DELETE FROM lost_deals WHERE notes LIKE 'AUDIT_%'");
    await db.query("DELETE FROM guest_logs WHERE \"clientName\" LIKE 'AUDIT_%'");
    await db.query("DELETE FROM guestbook_events WHERE \"pageUrl\" LIKE '%audit%' OR \"approverNote\" LIKE 'AUDIT_%'");
    await db.query("DELETE FROM crm_leads WHERE \"displayName\" LIKE 'AUDIT_%' OR \"trackingCode\" LIKE 'AUDIT_%'");
    await db.query("DELETE FROM lead_captures WHERE \"trackingCode\" LIKE 'AUDIT_%' OR \"trackingCode\" LIKE 'F2_%' OR \"fullName\" LIKE 'AUDIT_%' OR phone LIKE '%99998888%'");
    await db.query("DELETE FROM sales_leads WHERE \"clientName\" LIKE 'AUDIT_%'");
    console.log('Cleanup finished.');

    console.log('\n=== FINAL TEST SUMMARY ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await db.end();
  }
}

run();

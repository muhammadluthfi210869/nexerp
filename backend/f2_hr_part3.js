require('dotenv').config();
const http = require('http');
const { Client } = require('pg');

const BASE_PORT = 3216;

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body !== undefined && body !== null ? JSON.stringify(body) : null;
    const request = http.request({
      hostname: 'localhost',
      port: BASE_PORT,
      path: '/v1' + path,
      method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(resData) });
        } catch(e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: resData });
        }
      });
    });
    request.on('error', err => resolve({ error: err.message }));
    if (data) request.write(data);
    request.end();
  });
}

async function run() {
  const dbUrl = process.env.DATABASE_URL.replace(/\?schema=.*/, '').replace('/erp_db_test', '/audit_f2_hr');
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();

  const adminRes = await req('POST', '/auth/login', { email: 'zaki@dreamlab.com', password: 'password123' });
  const adminToken = adminRes.data.accessToken;

  // Find an existing active employee or create one
  const emps = await pg.query('SELECT id, name, "baseSalary", "positionAllowance" FROM employees WHERE "isActive" = true LIMIT 1');
  const empId = emps.rows[0].id;
  console.log('Target Employee for testing:', empId, emps.rows[0].name);

  // --------------------------------------------------------------------------
  // 4. CANDIDATES / RECRUITMENT
  // --------------------------------------------------------------------------
  console.log('\n[4] Testing Candidates / Recruitment...');
  const candPayload = {
    name: 'AUDIT_F2_CANDIDATE_TEST',
    email: 'audit_f2_candidate@example.com',
    phone: '081299998888',
    stage: 'APPLIED',
    notes: 'Audit candidate notes'
  };
  const candRes = await req('POST', '/hr/candidates', candPayload, adminToken);
  console.log('Create Candidate HTTP:', candRes.status, 'ID:', candRes.data?.id);
  const candId = candRes.data?.id;

  const dbCand = await pg.query('SELECT * FROM candidates WHERE id = $1', [candId]);
  console.log('DB Candidate exists:', !!dbCand.rows[0], 'Name:', dbCand.rows[0]?.name, 'Stage:', dbCand.rows[0]?.stage);

  // List candidates
  const listCand = await req('GET', '/hr/candidates', null, adminToken);
  console.log('List Candidates HTTP:', listCand.status, 'Count:', listCand.data?.length);

  // Read one
  const readOneCand = await req('GET', `/hr/candidates/${candId}`, null, adminToken);
  console.log('Read Candidate HTTP:', readOneCand.status, 'Stage:', readOneCand.data?.stage);

  // Update stage
  const updateStage = await req('PATCH', `/hr/candidates/${candId}/stage`, { stage: 'INTERVIEW' }, adminToken);
  console.log('Update Candidate Stage HTTP:', updateStage.status, 'New stage:', updateStage.data?.stage);
  const dbCandStage = await pg.query('SELECT stage FROM candidates WHERE id = $1', [candId]);
  console.log('DB Candidate Stage after update:', dbCandStage.rows[0]?.stage);

  // Check Candidate delete (is there a delete endpoint for candidates?)
  const delCand = await req('DELETE', `/hr/candidates/${candId}`, null, adminToken);
  console.log('Delete Candidate HTTP:', delCand.status);

  // --------------------------------------------------------------------------
  // 5. EMPLOYEE TRAINING
  // --------------------------------------------------------------------------
  console.log('\n[5] Testing Employee Training...');
  const trainPayload = {
    title: 'AUDIT_F2_GMP_TRAINING',
    institution: 'Balai Sertifikasi Manufaktur',
    startDate: '2026-09-01T09:00:00.000Z',
    endDate: '2026-09-02T17:00:00.000Z',
    hours: 16,
    passed: true,
    certificateNo: 'F2-CERT-2026-999'
  };
  const trainRes = await req('POST', `/hr/employees/${empId}/training`, trainPayload, adminToken);
  console.log('Create Training HTTP:', trainRes.status, 'Training ID:', trainRes.data?.id);
  const trainId = trainRes.data?.id;

  const dbTrain = await pg.query('SELECT * FROM employee_trainings WHERE id = $1', [trainId]);
  console.log('DB Training exists:', !!dbTrain.rows[0], 'Hours:', dbTrain.rows[0]?.hours, 'Passed:', dbTrain.rows[0]?.passed);

  // List trainings
  const listTrain = await req('GET', `/hr/employees/${empId}/trainings`, null, adminToken);
  console.log('List Trainings HTTP:', listTrain.status, 'Count:', listTrain.data?.length);

  // --------------------------------------------------------------------------
  // 6. EMPLOYEE LOANS (KASBON)
  // --------------------------------------------------------------------------
  console.log('\n[6] Testing Employee Loans (Kasbon)...');
  const loanPayload = {
    employeeId: empId,
    amount: 1500000,
    tenorMonths: 3,
    reason: 'AUDIT_F2_KASBON_DARURAT'
  };
  const loanRes = await req('POST', '/hr/loans', loanPayload, adminToken);
  console.log('Create Loan HTTP:', loanRes.status, 'Loan ID:', loanRes.data?.id, 'Monthly deduction:', loanRes.data?.monthlyDeduction);
  const loanId = loanRes.data?.id;

  const dbLoan = await pg.query('SELECT * FROM employee_loans WHERE id = $1', [loanId]);
  console.log('DB Loan exists:', !!dbLoan.rows[0], 'Amount:', dbLoan.rows[0]?.amount, 'Status:', dbLoan.rows[0]?.status);

  // List loans
  const listLoans = await req('GET', '/hr/loans', null, adminToken);
  console.log('List Loans HTTP:', listLoans.status, 'Count:', listLoans.data?.length);

  // --------------------------------------------------------------------------
  // 7. PAYROLL GENERATION & MANUAL RECALCULATION & GL CHECK
  // --------------------------------------------------------------------------
  console.log('\n[7] Testing Payroll Generation, Calculation & GL...');
  const journalCountBefore = await pg.query('SELECT count(*) FROM journal_entries');
  console.log('Initial Journal Entries in audit_f2_hr:', journalCountBefore.rows[0].count);

  // Check existing payrolls
  const listPayrollsBefore = await req('GET', '/hr/payrolls', null, adminToken);
  console.log('Payrolls list HTTP:', listPayrollsBefore.status, 'Total existing payrolls:', listPayrollsBefore.data?.length);

  // Generate payroll for period '2026-09'
  const genPayroll = await req('POST', '/hr/payroll/generate', { period: '2026-09' }, adminToken);
  console.log('Generate Payroll HTTP:', genPayroll.status, 'Payroll ID:', genPayroll.data?.id, 'Status:', genPayroll.data?.status, 'Items count:', genPayroll.data?.items?.length);
  const payrollId = genPayroll.data?.id;

  // DB check for payroll and payroll items
  const dbPayroll = await pg.query('SELECT * FROM payrolls WHERE id = $1', [payrollId]);
  console.log('DB Payroll row exists:', !!dbPayroll.rows[0], 'Period:', dbPayroll.rows[0]?.period, 'Status:', dbPayroll.rows[0]?.status);

  const dbItems = await pg.query('SELECT * FROM payroll_items WHERE "payrollId" = $1', [payrollId]);
  console.log('DB Payroll Items count:', dbItems.rows.length);

  // Inspect the target employee's payroll item
  const empItem = dbItems.rows.find(i => i.employeeId === empId) || dbItems.rows[0];
  console.log('Sample Payroll Item ID:', empItem?.id, 'employeeId:', empItem?.employeeId);

  // Get salary slip from API
  const slipRes = await req('GET', `/hr/payroll/slip/${empItem?.id}`, null, adminToken);
  console.log('Salary Slip API HTTP:', slipRes.status);
  console.log('Salary Slip Data:', JSON.stringify(slipRes.data, null, 2));

  // Authorize Payroll
  console.log('\nAuthorizing Payroll...');
  const authPayroll = await req('POST', `/hr/payroll/authorize/${payrollId}`, { authorizedById: '47f25784-1a25-4247-817b-63bb69b40b91' }, adminToken);
  console.log('Authorize Payroll HTTP:', authPayroll.status, 'Status:', authPayroll.data?.status, 'Total Disbursement:', authPayroll.data?.totalDisbursement);

  // VERIFY GENERAL LEDGER (GL) ENTRIES
  const journalCountAfter = await pg.query('SELECT count(*) FROM journal_entries');
  console.log('Journal Entries after Payroll Authorization:', journalCountAfter.rows[0].count);
  console.log('Delta Journal Entries:', Number(journalCountAfter.rows[0].count) - Number(journalCountBefore.rows[0].count));

  // --------------------------------------------------------------------------
  // 8. RBAC / AUTHORIZATION PROBES (Role DIGIMAR vs HR)
  // --------------------------------------------------------------------------
  console.log('\n[8] Testing RBAC / Authorization Probes...');
  // Find a DIGIMAR or non-HR user
  const digimarUser = await pg.query("SELECT email FROM users WHERE roles @> '[\"DIGIMAR\"]'::jsonb LIMIT 1");
  let digimarEmail = digimarUser.rows[0]?.email;
  if (!digimarEmail) {
    console.log('No DIGIMAR user found, checking other non-HR users...');
    const nonHr = await pg.query("SELECT email, roles FROM users WHERE NOT roles @> '[\"HR\"]'::jsonb AND NOT roles @> '[\"SUPER_ADMIN\"]'::jsonb LIMIT 1");
    digimarEmail = nonHr.rows[0]?.email;
  }
  console.log('Using non-HR user for testing:', digimarEmail);

  const nonHrLogin = await req('POST', '/auth/login', { email: digimarEmail, password: 'password123' });
  const nonHrToken = nonHrLogin.data?.accessToken;
  console.log('Non-HR Login status:', nonHrLogin.status, 'Token exists:', !!nonHrToken);

  // Probe protected HR endpoints with non-HR token:
  const probes = [
    { name: 'GET /hr/employees', method: 'GET', path: '/hr/employees' },
    { name: 'POST /hr/employees', method: 'POST', path: '/hr/employees', body: {} },
    { name: 'GET /hr/payrolls', method: 'GET', path: '/hr/payrolls' },
    { name: 'POST /hr/payroll/generate', method: 'POST', path: '/hr/payroll/generate', body: { period: '2026-10' } },
    { name: 'GET /hr/loans', method: 'GET', path: '/hr/loans' },
    { name: 'POST /hr/loans', method: 'POST', path: '/hr/loans', body: {} },
    { name: 'GET /hr/candidates', method: 'GET', path: '/hr/candidates' },
    { name: 'POST /hr/attendance/clock-in', method: 'POST', path: '/hr/attendance/clock-in', body: { employeeId: empId, lat: -6.2, lng: 106.8 } },
    { name: 'POST /hr/tickets', method: 'POST', path: '/hr/tickets', body: { employeeId: empId, type: 'LEAVE', startDate: '2026-10-01', reason: 'Test' } },
    { name: 'PATCH /hr/tickets/' + (trainId ? 'random' : 'test') + '/approve', method: 'PATCH', path: '/hr/tickets/random/approve', body: {} }
  ];

  for (const p of probes) {
    const res = await req(p.method, p.path, p.body, nonHrToken);
    console.log(`Non-HR Probe: ${p.name.padEnd(35)} -> HTTP ${res.status}`);
  }

  // Probe Anonymous (No token)
  console.log('\nAnonymous (No Token) Probes:');
  const anonProbes = [
    { name: 'GET /hr/employees', method: 'GET', path: '/hr/employees' },
    { name: 'GET /hr/payrolls', method: 'GET', path: '/hr/payrolls' },
    { name: 'GET /hr/tickets', method: 'GET', path: '/hr/tickets' },
    { name: 'POST /hr/attendance/clock-in', method: 'POST', path: '/hr/attendance/clock-in', body: {} }
  ];
  for (const p of anonProbes) {
    const res = await req(p.method, p.path, p.body, null);
    console.log(`Anon Probe:   ${p.name.padEnd(35)} -> HTTP ${res.status}`);
  }

  await pg.end();
}

run().catch(console.error);

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

  // Let's create an active employee for tests
  const testEmpRes = await req('POST', '/hr/employees', {
    name: 'AUDIT_F2_TEST_ACTIVE_EMP',
    nik: 'F2_9999000000000001',
    joinedAt: '2024-01-01T00:00:00.000Z',
    baseSalary: '5000000',
    positionAllowance: '1000000',
    transportFlat: '500000',
    transportTentativeDaily: '50000',
    roles: [{ division: 'MANAGEMENT', roleName: 'TESTER', weight: 1.0, isPrimary: true }]
  }, adminToken);
  const empId = testEmpRes.data?.id;
  console.log('Created Test Employee:', empId);

  // --------------------------------------------------------------------------
  // 2. ATTENDANCE CRUD
  // --------------------------------------------------------------------------
  console.log('\n[2] Testing Attendance...');
  // Factory coords from systemConfig or default: lat -6.2, lng 106.8
  const clockInRes = await req('POST', '/hr/attendance/clock-in', {
    employeeId: empId,
    lat: -6.200000,
    lng: 106.800000
  }, adminToken);
  console.log('Clock-In HTTP:', clockInRes.status, 'Status recorded:', clockInRes.data?.status);

  // Check DB
  const dbAtt = await pg.query('SELECT * FROM attendances WHERE "employeeId" = $1 ORDER BY "clockIn" DESC LIMIT 1', [empId]);
  console.log('DB Attendance row exists:', !!dbAtt.rows[0], 'clockIn:', dbAtt.rows[0]?.clockIn, 'clockOut:', dbAtt.rows[0]?.clockOut);

  // Duplicate clock-in
  const dupClockIn = await req('POST', '/hr/attendance/clock-in', {
    employeeId: empId,
    lat: -6.200000,
    lng: 106.800000
  }, adminToken);
  console.log('Duplicate Clock-In HTTP:', dupClockIn.status, 'Message:', dupClockIn.data?.message);

  // Clock-Out
  const clockOutRes = await req('POST', '/hr/attendance/clock-out', {
    employeeId: empId
  }, adminToken);
  console.log('Clock-Out HTTP:', clockOutRes.status, 'clockOut recorded:', clockOutRes.data?.clockOut);

  const dbAttAfterOut = await pg.query('SELECT * FROM attendances WHERE "employeeId" = $1 ORDER BY "clockIn" DESC LIMIT 1', [empId]);
  console.log('DB Attendance after clock-out:', !!dbAttAfterOut.rows[0]?.clockOut);

  // Read list & stats
  const listAtt = await req('GET', `/hr/attendance?employeeId=${empId}`, null, adminToken);
  console.log('Attendance List HTTP:', listAtt.status, 'Items:', listAtt.data?.length);

  const statsAtt = await req('GET', `/hr/employees/${empId}/attendance?days=30`, null, adminToken);
  console.log('Attendance Stats HTTP:', statsAtt.status, 'Total:', statsAtt.data?.total, 'Discipline rate:', statsAtt.data?.disciplineRate);

  // Delete attendance check
  const deleteAtt = await req('DELETE', `/hr/attendance/${dbAtt.rows[0]?.id}`, null, adminToken);
  console.log('Delete Attendance HTTP:', deleteAtt.status);

  // --------------------------------------------------------------------------
  // 3. TICKETS (LEAVE, OVERTIME, REIMBURSE)
  // --------------------------------------------------------------------------
  console.log('\n[3] Testing Tickets...');
  const ticketPayload = {
    employeeId: empId,
    type: 'LEAVE',
    reason: 'F2_AUDIT_LEAVE_REASON',
    startDate: '2026-10-10T00:00:00.000Z',
    endDate: '2026-10-12T00:00:00.000Z'
  };
  const createTicket = await req('POST', '/hr/tickets', ticketPayload, adminToken);
  console.log('Create Ticket HTTP:', createTicket.status, 'ID:', createTicket.data?.id, 'Status:', createTicket.data?.status);
  const ticketId = createTicket.data?.id;

  const dbTicket = await pg.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
  console.log('DB Ticket row exists:', !!dbTicket.rows[0], 'type:', dbTicket.rows[0]?.type, 'status:', dbTicket.rows[0]?.status);

  // Read list
  const listTickets = await req('GET', `/hr/tickets?employeeId=${empId}`, null, adminToken);
  console.log('Tickets List HTTP:', listTickets.status, 'Count:', listTickets.data?.length);

  // Read one
  const readOneTicket = await req('GET', `/hr/tickets/${ticketId}`, null, adminToken);
  console.log('Read One Ticket HTTP:', readOneTicket.status, 'Reason:', readOneTicket.data?.reason);

  // Approve ticket
  const approveTicket = await req('PATCH', `/hr/tickets/${ticketId}/approve`, { authorizedById: adminRes.data?.user?.id || '47f25784-1a25-4247-817b-63bb69b40b91' }, adminToken);
  console.log('Approve Ticket HTTP:', approveTicket.status, 'New status:', approveTicket.data?.status);

  const dbTicketApproved = await pg.query('SELECT status, "authorizedById" FROM tickets WHERE id = $1', [ticketId]);
  console.log('DB Ticket status after approve:', dbTicketApproved.rows[0]);

  // REIMBURSE TICKET & FUND REQUEST TEST (BUS-RULE-075)
  console.log('\nTesting REIMBURSE ticket -> FundRequest auto-trigger...');
  const fundReqCountBefore = await pg.query('SELECT count(*) FROM fund_requests');
  const reimburseTicket = await req('POST', '/hr/tickets', {
    employeeId: empId,
    type: 'REIMBURSE',
    reason: 'F2_AUDIT_REIMBURSE_TRANSPORT',
    startDate: '2026-10-01T00:00:00.000Z',
    amount: '750000'
  }, adminToken);
  const rTicketId = reimburseTicket.data?.id;

  // Approve via HrController (/approve)
  const approveReimburse = await req('PATCH', `/hr/tickets/${rTicketId}/approve`, { authorizedById: '47f25784-1a25-4247-817b-63bb69b40b91' }, adminToken);
  console.log('Approve REIMBURSE Ticket via /approve HTTP:', approveReimburse.status);

  const fundReqCountAfter = await pg.query('SELECT count(*) FROM fund_requests');
  console.log('Fund requests count before:', fundReqCountBefore.rows[0].count, 'after:', fundReqCountAfter.rows[0].count);

  // Check the newly created fund request
  const newFundReq = await pg.query('SELECT id, "requesterId", "departmentId", amount, status, reason FROM fund_requests WHERE reason LIKE $1', ['%Ticket ' + rTicketId + '%']);
  console.log('Auto-created FundRequest:', newFundReq.rows[0]);

  // Now test Frontend route PATCH /hr/tickets/:id (TicketsController) with REIMBURSE ticket!
  const reimburseTicketFE = await req('POST', '/hr/tickets', {
    employeeId: empId,
    type: 'REIMBURSE',
    reason: 'F2_AUDIT_REIMBURSE_VIA_FE_ROUTE',
    startDate: '2026-10-01T00:00:00.000Z',
    amount: '500000'
  }, adminToken);
  const rFeTicketId = reimburseTicketFE.data?.id;

  const fundReqBeforeFE = await pg.query('SELECT count(*) FROM fund_requests');
  const approveViaTicketsCtrl = await req('PATCH', `/hr/tickets/${rFeTicketId}`, { status: 'APPROVED', authorizedById: '47f25784-1a25-4247-817b-63bb69b40b91' }, adminToken);
  console.log('Approve REIMBURSE via TicketsController (/hr/tickets/:id) HTTP:', approveViaTicketsCtrl.status);
  const fundReqAfterFE = await pg.query('SELECT count(*) FROM fund_requests');
  console.log('Fund requests Δ via TicketsController:', Number(fundReqAfterFE.rows[0].count) - Number(fundReqBeforeFE.rows[0].count));

  // Delete ticket
  const delTicket = await req('DELETE', `/hr/tickets/${ticketId}`, null, adminToken);
  console.log('Delete Ticket HTTP:', delTicket.status);
  const dbTicketAfterDel = await pg.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
  console.log('DB Ticket after delete:', dbTicketAfterDel.rows[0] ? 'STILL EXISTS' : 'HARD DELETED');

  await pg.end();
}

run().catch(console.error);

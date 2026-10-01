require('dotenv').config();
const http = require('http');
const { Client } = require('pg');

const BASE_PORT = 3216;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
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
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL.replace(/\?schema=.*/, '').replace('/erp_db_test', '/audit_f2_hr');
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();

  console.log('Connected to audit_f2_hr');

  // 1. Login
  const loginRes = await request('POST', '/auth/login', { email: 'zaki@dreamlab.com', password: 'password123' });
  const adminToken = loginRes.data.accessToken;

  const hrLogin = await request('POST', '/auth/login', { email: 'yulia@dreamlab.com', password: 'password123' });
  const hrToken = hrLogin.data.accessToken;

  const nonHrLogin = await request('POST', '/auth/login', { email: 'gusti@dreamlab.com', password: 'password123' });
  const nonHrToken = nonHrLogin.data.accessToken;

  console.log('Tokens acquired');

  // --------------------------------------------------------------------------
  // TEST ENTITY 1: EMPLOYEE
  // --------------------------------------------------------------------------
  console.log('\n--- 1. EMPLOYEE CRUD ---');
  const empPayload = {
    name: 'AUDIT_F2_EMP_TEST_1',
    nik: 'F2_3201019999990001',
    joinedAt: '2025-01-01T00:00:00.000Z',
    baseSalary: '5000000',
    positionAllowance: '1000000',
    transportFlat: '500000',
    transportTentativeDaily: '50000',
    phone: '081299999999',
    roles: [
      { division: 'HR', roleName: 'AUDIT_OFFICER', weight: 1.0, isPrimary: true }
    ]
  };

  const createEmp = await request('POST', '/hr/employees', empPayload, adminToken);
  console.log('Create Employee HTTP:', createEmp.status, createEmp.data?.id ? 'ID: ' + createEmp.data.id : createEmp.data);
  const empId = createEmp.data?.id;

  // DB check
  const dbEmp = await pg.query('SELECT id, name, nik, "isActive", "baseSalary", "positionAllowance" FROM employees WHERE id = $1', [empId]);
  console.log('DB Employee row:', dbEmp.rows[0]);

  // Read List
  const listEmp = await request('GET', '/hr/employees', null, adminToken);
  const foundInList = Array.isArray(listEmp.data) && listEmp.data.some(e => e.id === empId);
  console.log('List Employees HTTP:', listEmp.status, 'Total returned:', listEmp.data?.length, 'Found newly created:', foundInList);

  // Read One
  const readEmp = await request('GET', `/hr/employees/${empId}`, null, adminToken);
  console.log('Read One Employee HTTP:', readEmp.status, 'Name:', readEmp.data?.name, 'NIK in response:', readEmp.data?.nik, 'baseSalary in response:', readEmp.data?.baseSalary);

  // Update (PATCH)
  const updateEmp = await request('PATCH', `/hr/employees/${empId}`, { phone: '081288888888', name: 'AUDIT_F2_EMP_UPDATED' }, adminToken);
  console.log('Update Employee HTTP:', updateEmp.status, 'Name in response:', updateEmp.data?.name);
  const dbEmpAfterUpdate = await pg.query('SELECT name, phone FROM employees WHERE id = $1', [empId]);
  console.log('DB Employee row after update:', dbEmpAfterUpdate.rows[0]);

  // Delete
  const deleteEmp = await request('DELETE', `/hr/employees/${empId}`, null, adminToken);
  console.log('Delete Employee HTTP:', deleteEmp.status, 'Response:', deleteEmp.data?.name, 'isActive:', deleteEmp.data?.isActive);
  const dbEmpAfterDelete = await pg.query('SELECT id, "isActive", "resignDate", "resignReason" FROM employees WHERE id = $1', [empId]);
  console.log('DB Employee row after delete:', dbEmpAfterDelete.rows[0]);

  // Can deleted employee still be read by ID?
  const readDeletedEmp = await request('GET', `/hr/employees/${empId}`, null, adminToken);
  console.log('Read Deleted Employee by ID HTTP:', readDeletedEmp.status, 'Returned data isActive:', readDeletedEmp.data?.isActive);

  // Is deleted employee in list?
  const listAfterDelete = await request('GET', '/hr/employees', null, adminToken);
  const foundDeletedInList = Array.isArray(listAfterDelete.data) && listAfterDelete.data.some(e => e.id === empId);
  console.log('Deleted employee found in GET /hr/employees list?:', foundDeletedInList);

  await pg.end();
}

main().catch(console.error);

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

  console.log('=== F2-HR COMPREHENSIVE RUNTIME AUDIT ===');

  // Login users
  const adminRes = await req('POST', '/auth/login', { email: 'zaki@dreamlab.com', password: 'password123' });
  const adminToken = adminRes.data.accessToken;

  const hrRes = await req('POST', '/auth/login', { email: 'yulia@dreamlab.com', password: 'password123' });
  const hrToken = hrRes.data.accessToken;

  const nonHrRes = await req('POST', '/auth/login', { email: 'gusti@dreamlab.com', password: 'password123' });
  const nonHrToken = nonHrRes.data.accessToken;

  console.log('Tokens initialized: Admin:', !!adminToken, 'HR:', !!hrToken, 'Non-HR (DIGIMAR):', !!nonHrToken);

  const results = {};

  // --------------------------------------------------------------------------
  // 1. EMPLOYEE CRUD
  // --------------------------------------------------------------------------
  console.log('\n[1] Testing Employee CRUD...');
  const empPayload = {
    name: 'AUDIT_F2_EMP_ALPHA',
    nik: 'F2_3201019999990002',
    birthDate: '1995-05-15T00:00:00.000Z',
    gender: 'L',
    religion: 'ISLAM',
    maritalStatus: 'SINGLE',
    phone: '081299990001',
    address: 'Jl. Audit F2 No. 1',
    emergencyContact: 'AUDIT_EMERGENCY',
    emergencyPhone: '081299990002',
    npwp: 'F2_09.999.999.9-999.000',
    bpjsKesehatan: 'F2_0001999999999',
    bpjsKetenagakerjaan: 'F2_0002999999999',
    bankName: 'BCA',
    bankAccount: '9999888877',
    bankHolder: 'AUDIT_F2_EMP_ALPHA',
    education: 'S1',
    major: 'Computer Science',
    baseSalary: '6000000',
    positionAllowance: '1500000',
    transportFlat: '600000',
    transportTentativeDaily: '50000',
    joinedAt: '2024-01-01T00:00:00.000Z',
    contractEnd: '2027-12-31T00:00:00.000Z',
    contractType: 'CONTRACT',
    roles: [
      { division: 'MANAGEMENT', roleName: 'AUDIT_SPECIALIST', weight: 1.0, isPrimary: true }
    ]
  };

  const createEmp = await req('POST', '/hr/employees', empPayload, adminToken);
  console.log('Employee Create HTTP:', createEmp.status);
  const empId = createEmp.data?.id;

  let empDbRow = null;
  let roleDbRow = null;
  if (empId) {
    const q1 = await pg.query('SELECT * FROM employees WHERE id = $1', [empId]);
    empDbRow = q1.rows[0];
    const q2 = await pg.query('SELECT * FROM employee_role_mappings WHERE "employeeId" = $1', [empId]);
    roleDbRow = q2.rows;
  }
  console.log('Employee DB Row created:', !!empDbRow, 'NIK:', empDbRow?.nik, 'baseSalary encrypted:', empDbRow?.baseSalary?.includes(':'));
  console.log('Role DB Mappings count:', roleDbRow?.length);

  // Read List
  const readListEmp = await req('GET', '/hr/employees', null, adminToken);
  const inList = Array.isArray(readListEmp.data) && readListEmp.data.some(e => e.id === empId);
  console.log('Employee Read List HTTP:', readListEmp.status, 'Total items:', readListEmp.data?.length, 'Found:', inList);

  // Read One
  const readOneEmp = await req('GET', `/hr/employees/${empId}`, null, adminToken);
  console.log('Employee Read One HTTP:', readOneEmp.status, 'Returned NIK:', readOneEmp.data?.nik, 'baseSalary exposed:', !!readOneEmp.data?.baseSalary);

  // Update
  const updateEmp = await req('PATCH', `/hr/employees/${empId}`, { phone: '081299998888', name: 'AUDIT_F2_EMP_UPDATED' }, adminToken);
  console.log('Employee Update HTTP:', updateEmp.status, 'Returned name:', updateEmp.data?.name);
  const empDbAfterUpdate = await pg.query('SELECT name, phone FROM employees WHERE id = $1', [empId]);
  console.log('Employee DB After Update:', empDbAfterUpdate.rows[0]);

  // Soft Delete
  const deleteEmp = await req('DELETE', `/hr/employees/${empId}`, null, adminToken);
  console.log('Employee Delete HTTP:', deleteEmp.status, 'Returned isActive:', deleteEmp.data?.isActive);
  const empDbAfterDelete = await pg.query('SELECT "isActive", "resignDate", "resignReason" FROM employees WHERE id = $1', [empId]);
  console.log('Employee DB After Delete:', empDbAfterDelete.rows[0]);

  // Read One after delete
  const readOneDeleted = await req('GET', `/hr/employees/${empId}`, null, adminToken);
  console.log('Employee Read One Deleted HTTP:', readOneDeleted.status, 'Can read deleted?:', !!readOneDeleted.data?.id);

  // Read List after delete
  const readListAfterDelete = await req('GET', '/hr/employees', null, adminToken);
  const inListAfterDelete = Array.isArray(readListAfterDelete.data) && readListAfterDelete.data.some(e => e.id === empId);
  console.log('Employee in Read List after Delete?:', inListAfterDelete);

  // Employee Validation test
  const badRoleWeight = await req('POST', '/hr/employees', {
    name: 'AUDIT_F2_BAD_WEIGHT',
    joinedAt: '2024-01-01T00:00:00.000Z',
    roles: [{ division: 'MANAGEMENT', roleName: 'STAFF', weight: 0.5, isPrimary: true }]
  }, adminToken);
  console.log('Employee Bad Role Weight (50%) HTTP:', badRoleWeight.status, 'Message:', badRoleWeight.data?.message);

  // Duplicate NIK test
  const dupNik1 = await req('POST', '/hr/employees', {
    name: 'AUDIT_F2_DUP_1',
    nik: 'F2_DUP_NIK_0001',
    joinedAt: '2024-01-01T00:00:00.000Z',
    roles: [{ division: 'MANAGEMENT', roleName: 'STAFF', weight: 1.0, isPrimary: true }]
  }, adminToken);
  const dupNik2 = await req('POST', '/hr/employees', {
    name: 'AUDIT_F2_DUP_2',
    nik: 'F2_DUP_NIK_0001',
    joinedAt: '2024-01-01T00:00:00.000Z',
    roles: [{ division: 'MANAGEMENT', roleName: 'STAFF', weight: 1.0, isPrimary: true }]
  }, adminToken);
  console.log('Duplicate NIK: First status:', dupNik1.status, 'Second status:', dupNik2.status, 'Detail/error:', dupNik2.data?.detail || dupNik2.data?.message || dupNik2.raw);

  // Invalid UUID test
  const invalidUuidEmp = await req('GET', '/hr/employees/not-a-valid-uuid', null, adminToken);
  console.log('Invalid UUID HTTP:', invalidUuidEmp.status, 'Detail/error:', invalidUuidEmp.data?.detail || invalidUuidEmp.data?.message);

  await pg.end();
}

run().catch(console.error);

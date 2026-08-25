// Probe backend on Biznet, list routes + login as users
const http = require('http');
function probe(method, path, body, token) {
  return new Promise((res) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': data.length } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (r) => {
      let d = '';
      r.on('data', (c) => d += c);
      r.on('end', () => res({ status: r.statusCode, body: d.slice(0, 1000) }));
    });
    req.on('error', (e) => res({ status: 0, body: 'ERR: ' + e.message }));
    if (data) req.write(data);
    req.end();
  });
}
(async () => {
  console.log('=== /health ===');
  console.log(JSON.stringify(await probe('GET', '/health'), null, 2));
  console.log('=== /auth/login candidate (no /api prefix) ===');
  const candidates = [
    'admin@nexerp.id',
    'admin@dreamlab.com',
    'marketing@nexerp.id',
    'rnd@nexerp.id',
    'hr@nexerp.id',
    'rahma@nexerp.id',
    'panca@nexerp.id',
    'revita@nexerp.id',
  ];
  for (const email of candidates) {
    const r = await probe('POST', '/auth/login', { email, password: 'password123' });
    console.log(`${email}: ${r.status} ${r.body.slice(0, 200)}`);
  }
  console.log('=== /api/auth/login ===');
  for (const email of candidates) {
    const r = await probe('POST', '/api/auth/login', { email, password: 'password123' });
    if (r.status !== 404) console.log(`${email}: ${r.status} ${r.body.slice(0, 200)}`);
  }
})();

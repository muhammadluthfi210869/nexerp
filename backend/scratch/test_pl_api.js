const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/finance/reports/profit-loss?startDate=2026-04-01&endDate=2026-04-30',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();

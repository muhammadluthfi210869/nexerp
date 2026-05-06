import http from 'http';

const data = JSON.stringify({
  email: 'production@portoaureon.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => console.log(body));
});

req.on('error', console.error);
req.write(data);
req.end();

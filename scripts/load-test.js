import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002';
const TOKEN = __ENV.JWT || '';

function getToken() {
  const res = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'admin@nexerp.id', password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status === 201) return JSON.parse(res.body).access_token;
  throw new Error(`Login failed: ${res.status}`);
}

const AUTH_TOKEN = TOKEN || getToken();
const AUTH = { headers: { Authorization: `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' } };

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '5s', target: 3 },
    { duration: '10s', target: 6 },
    { duration: '10s', target: 6 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    errors: ['rate<0.05'],
  },
};

export default function () {
  const scenarios = [
    () => {
      const res = http.get(`${BASE_URL}/bussdev/leads?limit=10`, AUTH);
      check(res, { 'GET leads 200': r => r.status === 200 });
      errorRate.add(res.status !== 200);
    },
    () => {
      const res = http.get(`${BASE_URL}/finance/dashboard`, AUTH);
      check(res, { 'GET finance dashboard 200': r => r.status === 200 });
      errorRate.add(res.status !== 200);
    },
    () => {
      const res = http.get(`${BASE_URL}/warehouse/catalog`, AUTH);
      check(res, { 'GET warehouse catalog 200': r => r.status === 200 });
      errorRate.add(res.status !== 200);
    },
    () => {
      const payload = JSON.stringify({
        clientName: `Load Test ${Date.now()}`,
        brandName: 'LoadTest', contactInfo: '0812000000',
        source: 'Instagram', productInterest: 'Serum',
        moq: 100, unitPrice: 50000, estimatedValue: 5000000,
        category: 'SKINCARE'
      });
      const res = http.post(`${BASE_URL}/bussdev/lead`, payload, AUTH);
      check(res, { 'POST lead 201': r => r.status === 201 });
      errorRate.add(res.status !== 201);
    },
    () => {
      const res = http.get(`${BASE_URL}/master/materials?limit=10`, AUTH);
      check(res, { 'GET materials 200': r => r.status === 200 });
      errorRate.add(res.status !== 200);
    },
    () => {
      const res = http.get(`${BASE_URL}/system/health`, AUTH);
      check(res, { 'GET health 200': r => r.status === 200 });
      errorRate.add(res.status !== 200);
    },
  ];

  const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
  pick();
  sleep(Math.random() * 1.5 + 0.3);
}

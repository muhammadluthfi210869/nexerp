require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

try {
  const p = new PrismaClient({ adapter });
  console.log('SUCCESS: PrismaClient created with adapter!');
  
  // Test actual connection
  p.$connect().then(() => {
    console.log('SUCCESS: Connected to database!');
    return p.user.findMany();
  }).then((users) => {
    console.log('Users found:', users.length);
    return p.$disconnect();
  }).then(() => {
    pool.end();
    console.log('DONE');
  }).catch(e => {
    console.log('DB Error:', e.message.substring(0, 300));
    pool.end();
  });
} catch(e) {
  console.log('FAIL:', e.message.substring(0, 300));
  pool.end();
}

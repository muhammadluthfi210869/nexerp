const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function reset() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Cleaning database...');
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await pool.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('Database cleaned.');
  } catch (e) {
    console.error('Error cleaning database:', e);
  } finally {
    await pool.end();
  }
}

reset();

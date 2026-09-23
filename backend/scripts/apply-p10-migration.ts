import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const migrationPath = path.resolve(__dirname, '../prisma/migrations/20260921140000_p10_procurement_controls/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Applying P10 migration...');
    await client.query(sql);
    console.log('P10 migration applied successfully!');

    // Check enum labels
    const enumRes = await client.query(`
      SELECT enumlabel FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'PRStatus'
    `);
    console.log('Updated PRStatus values:', enumRes.rows.map(r => r.enumlabel));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

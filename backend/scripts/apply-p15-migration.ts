import * as path from 'path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(__dirname, '../.env') });
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Applying P15 Finance & Closing DB migration...');

    // 1. Add allowManualJournal column to accounts if not exists
    await client.query(`
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "allowManualJournal" BOOLEAN NOT NULL DEFAULT true;
    `);
    console.log('Column allowManualJournal ensured on accounts table.');

    // 2. Set control accounts to allowManualJournal = false
    await client.query(`
      UPDATE accounts 
      SET "allowManualJournal" = false 
      WHERE code IN ('11200', '21100', '11300', '11400', '11500', '11600') 
         OR name ILIKE '%Piutang%' 
         OR name ILIKE '%Utang Usaha%' 
         OR name ILIKE '%Persediaan%';
    `);
    console.log('Control accounts updated to allowManualJournal = false.');

    // 3. Add MANUAL and ADJUSTMENT and COPQ to SourceDocumentType enum if not already present
    for (const val of ['MANUAL', 'ADJUSTMENT', 'COPQ']) {
      const check = await client.query(`
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'SourceDocumentType' AND enumlabel = $1
      `, [val]);
      if (check.rows.length === 0) {
        await client.query(`ALTER TYPE "SourceDocumentType" ADD VALUE '${val}';`);
        console.log(`Added value ${val} to SourceDocumentType enum.`);
      }
    }

    console.log('P15 DB migration applied successfully!');
  } catch (err) {
    console.error('P15 DB migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../backend/.env'),
});
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const res = await c.query(`
    SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
    WHERE tc.constraint_name = 'qc_audits_stepLogId_fkey'
  `);
  console.log('Constraint:', res.rows);
  await c.end();
}

main().catch(console.error);

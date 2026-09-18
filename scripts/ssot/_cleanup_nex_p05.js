const { Client } = require('../../backend/node_modules/pg');
const c = new Client({ connectionString: 'postgresql://postgres:66luthfi29@localhost:5432/postgres' });
c.connect()
  .then(() => c.query("SELECT datname FROM pg_database WHERE datname LIKE 'nex_p05%'"))
  .then(r => {
    const dbs = r.rows.map(x => x.datname);
    return Promise.all(dbs.map(d => c.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${d}' AND pid != pg_backend_pid()`).then(() => c.query(`DROP DATABASE IF EXISTS "${d}"`))));
  })
  .then(() => c.query("SELECT datname FROM pg_database WHERE datname LIKE 'nex_p05%'"))
  .then(r => { console.log('remaining:', r.rows); return c.end(); });

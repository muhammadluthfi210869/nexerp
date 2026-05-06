const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '5.223.80.88',
  port: 22,
  username: 'root',
  password: 'MarketingERP2026!#'
};

console.log('🚀 Testing NEW Password...');

conn.on('ready', () => {
  console.log('✅ Success! New password is valid.');
  conn.exec('ls', (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => console.log('STDOUT:', data.toString()));
    stream.on('close', () => conn.end());
  });
}).on('error', (err) => {
  console.error('❌ Failed with new password:', err.message);
  process.exit(1);
}).connect(config);

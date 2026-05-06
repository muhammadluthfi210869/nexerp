const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '5.223.80.88',
  port: 22,
  username: 'root',
  password: 'MarketingERP2026!#'
};

console.log('🚀 Running Diagnostics on VPS...');

conn.on('ready', () => {
  console.log('✅ Connected!');
  
  conn.exec('uname -a && df -h && docker --version', (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    }).on('close', () => {
      conn.end();
    });
  });
}).connect(config);

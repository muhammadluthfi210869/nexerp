const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '5.223.80.88',
  port: 22,
  username: 'root',
  password: 'f49uqcejNsraxq3ugbrX',
  // debug: (msg) => console.log('DEBUG:', msg)
};

console.log('🚀 Debugging SSH Connection with stderr...');

conn.on('ready', () => {
  console.log('✅ Connected!');
  conn.exec('ls', (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => console.log('STDOUT:', data.toString()));
    stream.stderr.on('data', (data) => console.log('STDERR:', data.toString()));
    stream.on('close', (code) => {
        console.log('EXIT CODE:', code);
        conn.end();
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Error:', err);
}).connect(config);

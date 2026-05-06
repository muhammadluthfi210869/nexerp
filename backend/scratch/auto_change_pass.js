const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '5.223.80.88',
  port: 22,
  username: 'root',
  password: 'f49uqcejNsraxq3ugbrX'
};

const oldPass = 'f49uqcejNsraxq3ugbrX';
const newPass = 'MarketingERP2026!#';

console.log('🚀 Attempting Automated Password Change...');

conn.on('ready', () => {
  console.log('✅ Connected! Opening Shell...');
  
  conn.shell((err, stream) => {
    if (err) throw err;
    
    let step = 0;
    
    stream.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Match Ubuntu 24.04 prompts
      if (output.toLowerCase().includes('current password') && step === 0) {
        console.log('\n📡 Sending Old Password...');
        stream.write(oldPass + '\n');
        step = 1;
      } else if (output.toLowerCase().includes('new password') && step === 1) {
        console.log('\n📡 Sending New Password...');
        stream.write(newPass + '\n');
        step = 2;
      } else if (output.toLowerCase().includes('retype') && step === 2) {
        console.log('\n📡 Confirming New Password...');
        stream.write(newPass + '\n');
        step = 3;
      } else if (output.toLowerCase().includes('updated successfully') || output.toLowerCase().includes('successful')) {
        console.log('\n🎉 PASSWORD CHANGED SUCCESSFULLY!');
        setTimeout(() => conn.end(), 2000);
      }
    });

    stream.on('close', () => {
      console.log('\nShell closed.');
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Error:', err);
}).connect(config);

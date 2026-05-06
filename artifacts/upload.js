const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

console.log('🚀 Uploading fresh deploy.tar.gz...');

const scp = spawn('scp', ['-v', '-o', 'StrictHostKeyChecking=no', 'deploy.tar.gz', `root@${ip}:/root/`], {
  shell: true
});

scp.stdout.on('data', (data) => console.log(`[STDOUT]: ${data}`));
scp.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`[STDERR]: ${output}`);
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    console.log('🔑 Sending password...');
    scp.stdin.write(password + '\n');
  }
});
scp.on('close', (code) => console.log(`✨ Upload finished with code ${code}`));

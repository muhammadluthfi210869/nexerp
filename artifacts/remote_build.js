const { spawn } = require('child_process');

const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';
const cmd = 'cd /root && tar -xzf deploy.tar.gz && chmod +x setup_hetzner.sh && ./setup_hetzner.sh && docker compose -f docker-compose.prod.yml up -d --build';

console.log('🚀 Connecting to Hetzner...');

const ssh = spawn('ssh', ['-v', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, cmd], {
  shell: true
});

ssh.stdout.on('data', (data) => {
  console.log(`[STDOUT]: ${data}`);
});

ssh.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`[STDERR]: ${output}`);
  
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    console.log('🔑 Sending password...');
    ssh.stdin.write(password + '\n');
  }
});

ssh.on('close', (code) => {
  console.log(`✨ Process finished with code ${code}`);
});

const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

const cmd = 'ufw allow 80/tcp && ufw reload && cd /root && tar -xzf deploy.tar.gz && docker compose -f docker-compose.prod.yml up -d --build';

console.log('🎭 Forcing TTY for guaranteed authentication...');

// -tt memaksa alokasi pseudo-terminal
const ssh = spawn('ssh', ['-tt', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, cmd], {
  shell: true
});

ssh.stdout.on('data', (data) => console.log(`[STDOUT]: ${data}`));
ssh.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`[STDERR]: ${output}`);
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    console.log('🔑 Sending password to TTY...');
    ssh.stdin.write(password + '\n');
  }
});
ssh.on('close', (code) => console.log(`✨ Finished with code ${code}`));

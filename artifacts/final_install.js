const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

// Perintah: Cek ukuran file, buka firewall, ekstrak, dan build docker
const cmd = 'ls -lh /root/deploy.tar.gz && ufw allow 80/tcp && ufw reload && cd /root && tar -xzf deploy.tar.gz && docker compose -f docker-compose.prod.yml up -d --build';

console.log('🚀 Starting Server Installation & Docker Build...');

const ssh = spawn('ssh', ['-v', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, cmd], {
  shell: true
});

ssh.stdout.on('data', (data) => console.log(`[STDOUT]: ${data}`));
ssh.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`[STDERR]: ${output}`);
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    console.log('🔑 Sending password...');
    ssh.stdin.write(password + '\n');
  }
});
ssh.on('close', (code) => console.log(`✨ Installation finished with code ${code}`));

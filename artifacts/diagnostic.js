const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

const cmd = 'echo "--- UFW STATUS ---" && ufw status && echo "--- DOCKER PS ---" && docker ps -a && echo "--- PORT BINDING ---" && ss -tulpn | grep -E ":80|:443"';

console.log('🩺 Running Diagnostics on Hetzner...');

const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', `root@${ip}`, cmd], {
  shell: true
});

ssh.stdout.on('data', (data) => console.log(data.toString()));
ssh.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    ssh.stdin.write(password + '\n');
  }
});
ssh.on('close', (code) => console.log(`✨ Diagnostics finished with code ${code}`));

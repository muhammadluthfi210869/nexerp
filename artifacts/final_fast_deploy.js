const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

const cmd = 'cd /root && rm -f deploy.tar.gz && ufw allow 80/tcp && ufw reload';

console.log('🛸 Uploading 1MB archive to Hetzner...');

// Langkah 1: Kirim file
const scp = spawn('scp', ['-o', 'StrictHostKeyChecking=no', 'deploy.tar.gz', `root@${ip}:/root/`], {
  shell: true
});

scp.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`[SCP_ERR]: ${output}`);
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    console.log('🔑 Sending password to SCP...');
    scp.stdin.write(password + '\n');
  }
});

scp.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Upload finished! Starting installation...');
    
    // Langkah 2: Ekstrak dan Build
    const installCmd = 'cd /root && tar -xzf deploy.tar.gz && docker compose -f docker-compose.prod.yml up -d --build';
    const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', `root@${ip}`, installCmd], {
      shell: true
    });
    
    ssh.stdout.on('data', (d) => console.log(`[STDOUT]: ${d}`));
    ssh.stderr.on('data', (d) => {
      const output = d.toString();
      console.log(`[SSH_ERR]: ${output}`);
      if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
        console.log('🔑 Sending password to SSH...');
        ssh.stdin.write(password + '\n');
      }
    });
    ssh.on('close', (c) => console.log(`✨ ERP System is now UP with code ${c}`));
  } else {
    console.log(`❌ Upload failed with code ${code}`);
  }
});

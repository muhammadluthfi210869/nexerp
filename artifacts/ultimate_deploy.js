const { spawn, execSync } = require('child_process');
const fs = require('fs');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

const publicKey = fs.readFileSync(process.env.USERPROFILE + '/.ssh/id_rsa.pub', 'utf8').trim();

// Step 1: Pasang SSH Key
const setupKeyCmd = `mkdir -p ~/.ssh && echo "${publicKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "KEY_ADDED_SUCCESS"`;

console.log('🔑 Setting up SSH Key on server...');

const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', `root@${ip}`, setupKeyCmd], {
  shell: true
});

ssh.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`[SSH_SETUP_ERR]: ${output}`);
  if (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password')) {
    console.log('🔑 Sending password...');
    ssh.stdin.write(password + '\n');
  }
});

ssh.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('KEY_ADDED_SUCCESS')) {
    console.log('✅ SSH Key added successfully!');
    console.log('🚀 Starting Final Deployment...');
    
    // Step 2: Jalankan Deploy Tanpa Password
    const deployCmd = 'ls -lh /root/deploy.tar.gz && ufw allow 80/tcp && ufw reload && cd /root && tar -xzf deploy.tar.gz && docker compose -f docker-compose.prod.yml up -d --build';
    
    const finalDeploy = spawn('ssh', ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, deployCmd], {
      shell: true
    });
    
    finalDeploy.stdout.on('data', (d) => console.log(`[STDOUT]: ${d}`));
    finalDeploy.stderr.on('data', (d) => console.log(`[STDERR]: ${d}`));
    finalDeploy.on('close', (c) => console.log(`✨ Process finished with code ${c}`));
  }
});

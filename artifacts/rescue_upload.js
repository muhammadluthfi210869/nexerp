const { spawn } = require('child_process');
const fs = require('fs');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

console.log('🛸 Attempting Rescue Upload via SSH Stream...');

// Kita gunakan cat untuk menulis langsung ke file di server
const sshPath = 'C:\\Windows\\System32\\OpenSSH\\ssh.exe';
const ssh = spawn(sshPath, ['-v', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, 'cat > /root/deploy.tar.gz'], {
  shell: true
});

const filePath = 'c:\\GAWE\\Web Dev\\Porto Aureon\\ERP FROM ZERO\\deploy.tar.gz';
const fileStream = fs.createReadStream(filePath);
let passwordSent = false;

ssh.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output); // Biar kita bisa liat progresnya di log
  
  if (!passwordSent && (output.toLowerCase().includes('password:') || output.toLowerCase().includes('next authentication method: password'))) {
    console.log('\n🔑 Sending password...');
    ssh.stdin.write(password + '\n');
    passwordSent = true;
    
    // Tunggu sebentar agar otentikasi selesai sebelum mulai streaming file
    setTimeout(() => {
      console.log('📦 Streaming file content...');
      fileStream.pipe(ssh.stdin);
    }, 2000);
  }
});

fileStream.on('end', () => {
  console.log('✅ File stream finished.');
});

ssh.on('close', (code) => {
  console.log(`✨ Process finished with code ${code}`);
});

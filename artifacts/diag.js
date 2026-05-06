const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';

// Kita cek docker ps -a
const ssh = spawn('ssh', ['-tt', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, 'docker ps -a'], {
    shell: true
});

ssh.stdout.on('data', (data) => {
    const out = data.toString();
    console.log('[OUT]:', out);
});

ssh.stderr.on('data', (data) => {
    const err = data.toString();
    console.log('[ERR]:', err);
    if (err.toLowerCase().includes('password')) {
        ssh.stdin.write(password + '\n');
    }
});

ssh.on('close', (code) => {
    console.log('Exited with code:', code);
});

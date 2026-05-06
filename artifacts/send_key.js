const { spawn } = require('child_process');
const password = 'xcTALimEkHTs';
const ip = '5.223.80.88';
const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDsH3YkALlYcJBm7OS/3h/0MpRW6ul67hGQ5euQ7/OhSdaX8e+/lpyKci2noFwKHzYEsRd+Ok3934unqTdQRXkBI9gxKwSVe0XQeASo43p86Qj4VkfaACEnkz56ED2Rjy0NvDX542nilZcNavW+TYjv6gepnokAZ/3ZdjaEzOMHA+2GXngQN9fcNxsQTWhMgsMSyqc8sO7ceAIuq5MWfSm84kIf/wNjhmpdxe8/3gDk71n97mZp8Z3d7ljYBRzybbz/0UVXP5S7bwLiovR1sFGZfymjLwhPtpvz6atbA5RUpj4vS7DWdDyI746QZgqVH1JHLPuyseuhgcxhCNg4KncQ9X3RQb5yShVEl2JV78s2EZFGjazxCIe+i411WMXU5YQjKsW3zx2U6HMCALL8pzWw11IS3OoViADcUZKfrQCYeCO41GFpL8peqg2bLq9ZwxdxazzcCAv87nKwNPTH1XuuTsWpUUIy58CtIKRknK83KI0hTa74i8dX4y5pHUwsoZDfvUJ9QfTJx6V4eybYq4POtuILMASQ63Tvsv+QaxmcB0DRCmgeUWiuQbu+84DHi9Ej1ji6Zuvmzu3MaMglvDMWGel+CB+5U5+qOeNEPlL04mAZ9ksCNDY39ruXmxswHzW+n3o5e9ytIqHQ3WN3LJOWAF0sZKoCIJtZPZ9Byt3zRQ== luthfi@NITRO';

const cmd = `mkdir -p ~/.ssh && echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`;

console.log('🚀 Sending SSH Key to server...');

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
ssh.on('close', (code) => console.log(`✨ Key transfer finished with code ${code}`));

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
  host: '5.223.80.88', port: 22, username: 'root', password: 'MarketingERP2026!#'
};

console.log('🚀 [FINAL_PUSH] Starting...');

conn.on('ready', () => {
  console.log('✅ Connected!');
  executeCommands([
    'DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt-get update -y',
    'DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt-get install -y tar curl docker.io docker-compose-v2',
    'mkdir -p /root/app',
    'tar -xzf /root/deploy.tar.gz -C /root/app',
    'cd /root/app && docker compose up -d --build',
    'sleep 30',
    'docker exec app-backend-1 npx prisma migrate deploy',
    'docker exec app-backend-1 npx ts-node prisma/seed-marketing.ts'
  ]);
}).connect(config);

function executeCommands(commands) {
  if (commands.length === 0) {
    console.log('\n✨ ALL SYSTEMS LIVE! http://5.223.80.88:3000');
    conn.end();
    return;
  }
  const cmd = commands.shift();
  console.log(`\n📡 [SERVER]: ${cmd}`);
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => executeCommands(commands));
  });
}

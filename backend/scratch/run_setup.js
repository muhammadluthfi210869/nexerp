const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '5.223.80.88', port: 22, username: 'root', password: 'MarketingERP2026!#'
};

console.log('🚀 Starting Remote Setup (File already exists)...');

conn.on('ready', () => {
  executeCommands([
    'apt-get update',
    'apt-get install -y tar curl docker.io docker-compose-v2',
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
    console.log('\n✨ DEPLOYMENT COMPLETE! ✨');
    console.log('🌐 Dashboard: http://5.223.80.88:3000');
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

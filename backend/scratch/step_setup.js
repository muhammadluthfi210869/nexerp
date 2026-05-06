const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '5.223.80.88', port: 22, username: 'root', password: 'MarketingERP2026!#'
};

console.log('🚀 Manual Setup Step-by-Step...');

conn.on('ready', () => {
  executeCommands([
    'tar -xzf /root/deploy.tar.gz -C /root/app',
    'cd /root/app && docker compose build --no-cache backend',
    'cd /root/app && docker compose build --no-cache frontend',
    'cd /root/app && docker compose up -d',
    'sleep 30',
    'docker exec app-backend-1 npx prisma migrate deploy',
    'docker exec app-backend-1 npx ts-node prisma/seed-marketing.ts'
  ]);
}).connect(config);

function executeCommands(commands) {
  if (commands.length === 0) {
    console.log('\n✨ DEPLOYMENT COMPLETE! ✨');
    conn.end();
    return;
  }

  const cmd = commands.shift();
  console.log(`\n📡 [EXEC]: ${cmd}`);
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => executeCommands(commands));
  });
}

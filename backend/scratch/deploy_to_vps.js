const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
  host: '5.223.80.88',
  port: 22,
  username: 'root',
  password: 'f49uqcejNsraxq3ugbrX'
};

const localFilePath = path.join(__dirname, '../../deploy.tar.gz');

console.log('🚀 Connecting to VPS...');

conn.on('ready', () => {
  console.log('✅ Connected! Starting Stream Upload (cat method)...');
  
  conn.exec('cat > /root/deploy.tar.gz', (err, stream) => {
    if (err) throw err;
    
    const stats = fs.statSync(localFilePath);
    const fileSize = stats.size;
    let uploaded = 0;

    const readStream = fs.createReadStream(localFilePath);
    
    readStream.on('data', (chunk) => {
      uploaded += chunk.length;
      const percent = ((uploaded / fileSize) * 100).toFixed(2);
      process.stdout.write(`\r📤 Uploading: ${percent}% (${uploaded}/${fileSize} bytes)`);
    });

    readStream.on('end', () => {
      console.log('\n✅ File sent to stream. Closing stream...');
      stream.end();
    });

    stream.on('close', (code, signal) => {
      console.log('✅ Upload Finished! Starting Remote Commands...');
      
      executeCommands([
        'apt-get update',
        'apt-get install -y tar curl',
        'mkdir -p /root/app',
        'tar -xzf /root/deploy.tar.gz -C /root/app',
        'curl -fsSL https://get.docker.com -o get-docker.sh',
        'sh get-docker.sh',
        'cd /root/app && docker compose up -d --build',
        'sleep 20', // Extended wait for DB
        'docker exec app-backend-1 npx prisma migrate deploy',
        'docker exec app-backend-1 npx ts-node prisma/seed-marketing.ts'
      ]);
    });

    readStream.pipe(stream);
  });
}).connect(config);

function executeCommands(commands) {
  if (commands.length === 0) {
    console.log('\n🎉 ALL SYSTEMS ONLINE! Access at http://5.223.80.88:3000');
    conn.end();
    return;
  }

  const cmd = commands.shift();
  console.log(`\n📡 [EXEC]: ${cmd}`);
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(`❌ Error executing ${cmd}:`, err);
      conn.end();
      return;
    }
    
    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    }).on('close', (code, signal) => {
      if (code !== 0) console.warn(`⚠️ Warning: Exit code ${code}`);
      executeCommands(commands);
    });
  });
}

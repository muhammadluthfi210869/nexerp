const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '5.223.80.88', port: 22, username: 'root', password: 'MarketingERP2026!#' };
conn.on('ready', () => {
  conn.exec('docker ps', (err, stream) => {
    stream.on('data', (data) => console.log(data.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);

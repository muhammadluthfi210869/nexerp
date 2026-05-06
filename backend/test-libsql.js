const { createClient } = require('@libsql/client');
const url = 'file:./dev.db';
console.log('Creating client with URL:', url);
const client = createClient({ url });
console.log('Client created:', client);
console.log('Client URL:', client.url);
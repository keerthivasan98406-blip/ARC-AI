const https = require('https');

const data = JSON.stringify({
  messages: [{ role: 'user', content: 'AKbot test' }]
});

const options = {
  hostname: 'akbot-backend.onrender.com',
  port: 443,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🚀 Testing backend at: https://akbot-backend.onrender.com/api/chat');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();

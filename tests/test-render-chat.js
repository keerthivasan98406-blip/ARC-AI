const https = require('https');

const data = JSON.stringify({
  messages: [
    { role: 'system', content: 'You are AKbot AI OS.' },
    { role: 'user', content: 'Hello AKbot' }
  ],
  stream: false
});

const options = {
  hostname: 'akbot.onrender.com',
  port: 443,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Response body:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error testing endpoint:', error);
});

req.write(data);
req.end();

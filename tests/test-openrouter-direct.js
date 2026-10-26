const https = require('https');

const API_KEY = process.env.OPENROUTER_API_KEY || '';

const data = JSON.stringify({
  model: 'meta-llama/llama-3.3-70b-instruct',
  messages: [
    { role: 'user', content: 'Say hello from AKbot AI OS!' }
  ]
});

const options = {
  hostname: 'openrouter.ai',
  port: 443,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'HTTP-Referer': 'https://akbot.online/',
    'X-Title': 'AKbot AI'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('RESPONSE:', body);
  });
});

req.on('error', e => console.error('ERROR:', e));
req.write(data);
req.end();

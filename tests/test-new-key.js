const https = require('https');

const API_KEY = process.env.OPENROUTER_API_KEY || '';

const data = JSON.stringify({
  model: 'google/gemini-2.0-flash-001',
  messages: [{ role: 'user', content: 'Testing AKbot AI' }]
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
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

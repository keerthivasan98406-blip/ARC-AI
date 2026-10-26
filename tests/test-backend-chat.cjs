const http = require('http');

const data = JSON.stringify({
  messages: [{ role: 'user', content: 'hello' }],
  model: 'gpt-5'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log('Backend Chat Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Backend Chat Response:\n', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

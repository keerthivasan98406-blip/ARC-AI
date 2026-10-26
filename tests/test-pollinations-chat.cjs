const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const https = require('https');

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || !addresses.length) {
      return dns.lookup(hostname, options, callback);
    }
    if (options && options.all) {
      return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
    }
    return callback(null, addresses[0], 4);
  });
}

function callPollinationsAI(messages) {
  return new Promise((resolve, reject) => {
    const formattedPrompt = messages.map(m => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n\n');

    const data = JSON.stringify({
      messages: [
        { role: 'system', content: 'You are AKbot AI, a helpful, intelligent assistant. Answer questions accurately with markdown and code snippets when requested.' },
        ...messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
          content: typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map(c => c.text || '').join(' ') : ''
        }))
      ],
      model: 'openai',
      jsonMode: false
    });

    const options = {
      hostname: 'text.pollinations.ai',
      path: '/',
      method: 'POST',
      lookup: customLookup,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && body.trim()) {
          resolve(body);
        } else {
          reject(new Error(`Pollinations API status ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Pollinations API timeout'));
    });

    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const response = await callPollinationsAI([
      { role: 'user', content: 'Write a Python function to calculate Fibonacci numbers and explain how it works.' }
    ]);
    console.log('--- POLLINATIONS REAL LLM AI RESPONSE ---');
    console.log(response);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();

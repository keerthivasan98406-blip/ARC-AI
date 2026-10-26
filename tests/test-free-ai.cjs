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

// Test 1: Pollinations AI API (Free, no key needed)
function testPollinations() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      messages: [{ role: 'user', content: 'Say hello in 5 words' }],
      model: 'openai'
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

    console.log('Testing Pollinations AI...');
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Pollinations Status: ${res.statusCode}`);
        console.log(`Pollinations Output: ${body.substring(0, 200)}`);
        resolve(res.statusCode === 200 && body.length > 0 ? body : null);
      });
    });

    req.on('error', e => {
      console.log('Pollinations Error:', e.message);
      resolve(null);
    });

    req.setTimeout(8000, () => {
      req.destroy();
      console.log('Pollinations Timeout');
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

(async () => {
  const result = await testPollinations();
  console.log('Final Result:', result);
})();

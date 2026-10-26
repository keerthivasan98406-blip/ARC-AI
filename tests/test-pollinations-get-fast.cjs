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

function callPollinationsGET(promptText) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(promptText);
    const options = {
      hostname: 'text.pollinations.ai',
      path: '/' + encoded + '?model=openai',
      method: 'GET',
      lookup: customLookup
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && body.trim()) {
          resolve(body);
        } else {
          reject(new Error(`Pollinations GET status ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Pollinations GET timeout'));
    });

    req.end();
  });
}

(async () => {
  try {
    const response = await callPollinationsGET('Explain quantum computing in 2 simple sentences.');
    console.log('--- POLLINATIONS GET RESPONSE ---');
    console.log(response);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();

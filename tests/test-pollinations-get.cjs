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

const prompt = encodeURIComponent('Write a 2-line poem about space AI');
const options = {
  hostname: 'text.pollinations.ai',
  path: '/' + prompt,
  method: 'GET',
  lookup: customLookup
};

console.log('Sending GET request to Pollinations...');
const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:\n', body));
});

req.on('error', e => console.error(e));
req.end();

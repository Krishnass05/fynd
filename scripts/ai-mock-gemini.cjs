// A pretend Gemini server for testing: flags anything that mentions a riddle-style number.
const http = require('http');
let hits = 0;
http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => (body += d));
  req.on('end', () => {
    if (req.url === '/hits') { res.end(String(hits)); return; }
    hits += 1;
    if (!req.headers['x-goog-api-key']) { res.statusCode = 401; res.end('{}'); return; }
    const text = JSON.parse(JSON.parse(body).contents[0].parts[0].text).text;
    const bad = /independence|pin code|riddle/i.test(text);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ share_contact: bad, reasons: bad ? ['a phone number given as a riddle'] : [] }) }] } }] }));
  });
}).listen(4010, () => console.log('mock gemini on 4010'));

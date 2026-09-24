const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const requested = path.join(root, cleanPath);
  if (fs.existsSync(requested) && fs.statSync(requested).isDirectory()) return path.join(requested, 'index.html');
  return requested === root ? path.join(root, 'index.html') : requested;
}

http.createServer((request, response) => {
  const file = resolveFile(request.url || '/');
  fs.readFile(file, (error, content) => {
    if (error) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    response.end(content);
  });
}).listen(5500, '127.0.0.1', () => console.log('Rondineli Cell em http://localhost:5500/'));

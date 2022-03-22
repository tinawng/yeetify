require('dotenv').config()
const http2 = require('http2');
const path = require('path');
const fs = require('fs');
const CachedFs = require('cachedfs'), cfs = new CachedFs();
const pino = require('pino'), logger = pino(pino.destination({ dest: process.env.LOG_PATH + 'logs', minLength: 4096, sync: false }));
const got = require('got'), log_api = got.extend({ prefixUrl: "https://tanabata.tina.cafe/logs/", headers: { 'X-API-KEY': process.env.LOG_API_KEY }, responseType: 'json', resolveBodyOnly: true });

// 🔊 Set logging level
logger.level = 'trace';
// 🚽 Asynchronously flush every 3 seconds to keep the buffer empty in periods of low activity
setInterval(() => { logger.flush() }, 3000).unref();

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff2': 'font/woff2',
    '.wasm': 'application/wasm'
};

http2.createSecureServer({
    key: fs.readFileSync(process.env.CERT_PATH + 'privkey.pem'),
    cert: fs.readFileSync(process.env.CERT_PATH + 'cert.pem'),
    allowHTTP1: true
}, function (request, response) {
    // 🔥 Sanitize 
    request.url = encodeURI(request.url);
    request.headers = sanitizeHeaders(request.headers);

    // 🔊 Log request
    logger.trace({ req: { method: request.method, url: request.url, headers: request.headers } });
    log_api.post('http_req', { json: { service: request.headers.host, client: request.headers['x-forwarded-for'], request: { method: request.method, url: request.url, headers: request.headers } } })

    // ♻️ Handle implicit index.html request
    var filePath = request.url == '/' ? '/index.html' : request.url;

    // 📝 Set file type
    var extname = String(path.extname(filePath)).toLowerCase();
    if (process.env.SPA && !extname) extname = '.html';
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    if (process.env.SPA && extname == '.html') filePath = '/index.html';

    // 📦 Serve compressed file if possible
    var encoding = '';
    if (['.html', '.js', '.css'].includes(extname)) {
        if (request.headers['accept-encoding']?.includes('br')) {
            encoding = '.br';
            response.setHeader('Content-Encoding', 'br');
        }
        else {
            encoding = '.gz';
            response.setHeader('Content-Encoding', 'gzip');
        }
    }

    // 🗃️ Set cache policy
    if (contentType != 'text/html' && (contentType.includes('text') || contentType.includes('application') || contentType.includes('image') || contentType.includes('font')))
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // 🚀 Read and serve file
    cfs.readFile('./dist' + filePath + encoding, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                cfs.readFile('./404.html', function (error, content) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            }
            else if (error.code == 'EISDIR') {
                cfs.readFile('./dist' + filePath + '/index.html', function (error, content) {
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}).listen(process.env.SRV_PORT);

function sanitizeHeaders(headers) {
    for (const header in headers)
        headers[header] = headers[header].replace(/[^a-zA-Z0-9"#$%&'()*+,-./:;=?@[\]_ ]/g, '');
    return headers
}

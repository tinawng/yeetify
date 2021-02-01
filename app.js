require('dotenv').config()
const http2 = require('http2');
const path = require('path');
const fs = require('fs');
const CachedFs = require('cachedfs'), cfs = new CachedFs();

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

http2.createSecureServer({
    key: fs.readFileSync(process.env.CERT_PATH + 'privkey.pem'),
    cert: fs.readFileSync(process.env.CERT_PATH + 'cert.pem'),
    allowHTTP1: true
}, function (request, response) {
    // 🔊 Log requested route
    console.log('request ', request.url);

    // ♻️ Clarify implicit index.html request
    var filePath = request.url == '/' ? '/index.html' : request.url;

    // 📝 Set media type
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 📦 Serve compressed file if available
    var encoding = ''
    if (['.html', '.js', '.css'].includes(extname)) {
        if (request.headers['accept-encoding'].includes('br')) {
            encoding = '.br'
            response.setHeader('Content-Encoding', 'br')
        }
        else {
            encoding = '.gz'
            response.setHeader('Content-Encoding', 'gzip')
        }
    }

    // 🗃️ Set cache policy
    if (contentType != 'text/html' && (contentType.includes('text') || contentType.includes('image') || contentType.includes('application')))
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

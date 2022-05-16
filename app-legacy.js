require('dotenv').config()
var http = require('http');
const CachedFs = require('cachedfs'), cfs = new CachedFs();

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


http.createServer(function (request, response) {
    // 🔥 Sanitize 
    request.url = encodeURI(request.url);
    request.headers = sanitizeHeaders(request.headers);

    // ♻️ Handle implicit index.html request
    var filePath = request.url == '/' ? '/index.html' : request.url;

    // 📝 Set file type
    var extname = String(path.extname(filePath)).toLowerCase();
    if (process.env.SPA && !extname) extname = '.html';
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    if (process.env.SPA && extname == '.html') filePath = '/index.html';
    
    if (process.env.LEGACY_OPEN_CORS) response.setHeader('Access-Control-Allow-Origin', '*')

    // 🚀 Read and serve file
    cfs.readFile('./dist' + filePath, function (error, content) {
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

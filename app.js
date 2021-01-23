require('dotenv').config()
var http2 = require('http2');
var path = require('path');
var fs = require('fs');
var CachedFs = require('cachedfs'), cfs = new CachedFs();

http2.createSecureServer({
    key: fs.readFileSync(process.env.CERT_PATH + 'privkey.pem'),
    cert: fs.readFileSync(process.env.CERT_PATH + 'cert.pem'),
    allowHTTP1: true
}, function (request, response) {
    console.log('request ', request.url);

    var filePath = request.url;
    if (filePath == '/') {
        filePath = '/index.html';
    }

    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
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
        '.woff': 'application/font-woff',
        '.woff2': 'application/font-woff2',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    var contentType = mimeTypes[extname] || 'application/octet-stream';

    cfs.readFile('./dist' + filePath, function (error, content) {
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
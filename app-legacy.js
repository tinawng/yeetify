require('dotenv').config()
var http = require('http');
const fs = require('fs');
const CachedFs = require('cachedfs'), cfs = new CachedFs();
var path = require('path');
const pino = require('pino'), logger = pino(pino.destination({ dest: process.env.LOG_PATH + 'logs-legacy', minLength: 4096, sync: false }));

// 🔊 Set logging level
logger.level = 'trace';
// 🚽 Asynchronously flush every 3 seconds to keep the buffer empty in periods of low activity
setInterval(() => { logger.flush() }, 3000).unref();
// 🥅 Catch all the ways node might exit
const handler = pino.final(logger, (err, finalLogger, evt) => {
    finalLogger.info(`${evt} caught`)
    if (err) finalLogger.error(err, 'error caused exit')
    process.exit(err ? 1 : 0)
})
process.on('beforeExit', () => handler(null, 'beforeExit'))
process.on('exit', () => handler(null, 'exit'))
process.on('uncaughtException', (err) => handler(err, 'uncaughtException'))
process.on('SIGINT', () => handler(null, 'SIGINT'))
process.on('SIGQUIT', () => handler(null, 'SIGQUIT'))
process.on('SIGTERM', () => handler(null, 'SIGTERM'))

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
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.wasm': 'application/wasm'
};



http.createServer(function (request, response) {
    // 🔊 Log request
    logger.trace(request)

    // ♻️ Handle implicit index.html request
    var filePath = request.url == '/' ? '/index.html' : request.url;

    // 📝 Set media type
    var extname = String(path.extname(filePath)).toLowerCase();
    var contentType = mimeTypes[extname] || 'application/octet-stream';

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

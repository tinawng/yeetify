import "dotenv/config"
import http from "node:http"
import http2 from "node:http2"
import { walk } from "@root/walk"
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { extname } from "path"
import { StaticPool } from "node-worker-threads-pool"

const log_request = process.env.NODE_NAME && process.env.LOG_API_URL && process.env.LOG_API_PASSWORD
let log_api_token, log_worker_pool
if (log_request) {
    // 🗝️ Get API token
    ({ token: log_api_token } = await (await fetch(process.env.LOG_API_URL + "/api/collections/users/auth-with-password", { headers: { "Referer": process.env.NODE_NAME, 'Content-Type': 'application/json' }, method: 'POST', body: JSON.stringify({ identity: 'yeetify', password: process.env.LOG_API_PASSWORD }) })).json())

    // 🐜 Create workers pool
    log_worker_pool = new StaticPool({
        size: 3,
        task: async ({ log_api_token, payload }) => {
            await fetch(process.env.LOG_API_URL + "/api/collections/records/records", {
                headers: { "Referer": process.env.NODE_NAME, 'Content-Type': 'application/json', 'Authorization': log_api_token },
                method: 'POST',
                body: JSON.stringify(payload)
            })
        }
    });
}

// 🗃️ Load everything in memory
const cache = new Map()
await walk("./dist/", async (err, path, file) => {
    if (err) throw err
    if (file.isFile()) cache.set(path.replace('dist', ''), await readFile(path))
})

const mime_types = new Map([
    ['.html', 'text/html'],
    ['.js', 'text/javascript'],
    ['.css', 'text/css'],
    ['.json', 'application/json'],
    ['.webmanifest', 'application/manifest+json'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpg'],
    ['.webp', 'image/webp'],
    ['.gif', 'image/gif'],
    ['.svg', 'image/svg+xml'],
    ['.wav', 'audio/wav'],
    ['.mp4', 'video/mp4'],
    ['.woff2', 'font/woff2'],
    ['.wasm', 'application/wasm'],
    ['.md', 'text/markdown'],
    ['.txt', 'text/plain']
])

function handler(request, response) {
    // 🔥 Sanitize
    const path = encodeURI(request.url)
    const request_accept_encoding = request.headers['accept-encoding']?.replace(/[^a-zA-Z0-9"#$%&'()*+,-./:;=?@[\]_ ]/g, '')

    // ♻️ Handle implicit index.html request
    let ext_name = String(extname(path)).toLowerCase()
    let file_path
    if (!ext_name) {
        file_path = path.endsWith('/') ? `${path}index.html` : `${path}/index.html`
        ext_name = '.html'
    }
    else file_path = path

    // 📝 Set file type
    const content_type = mime_types.get(ext_name) || 'application/octet-stream'
    response.setHeader('Content-Type', content_type)

    // 🔀 Reroute for SPA
    if (process.env.SPA === 'true' && content_type === 'text/html') file_path = '/index.html'


    // 📦 Serve compressed file if possible
    let encoding = ''
    if (['.html', '.js', '.css'].includes(ext_name)) {
        if (request_accept_encoding?.includes('br') && cache.has(file_path + '.br')) {
            encoding = '.br'
            response.setHeader('Content-Encoding', 'br')
        }
        else if (request_accept_encoding?.includes('gzip') && cache.has(file_path + '.gz')) {
            encoding = '.gz'
            response.setHeader('Content-Encoding', 'gzip')
        }
    }

    // 🍱 Set cache policy
    if (content_type !== 'text/html'
        && content_type !== 'application/manifest+json'
        && content_type !== 'text/markdown'
        && !file_path.endsWith('sw.js'))
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    // 🚀 Serve file from cache
    let resp_code = undefined
    if (cache.has(file_path + encoding)) {
        resp_code = 200
        response.writeHead(200)
        response.end(cache.get(file_path + encoding), 'utf-8')
    }
    else {
        resp_code = 404
        response.writeHead(404)
        response.end("", 'utf-8')
    }

    // 📃 Log request
    if (log_request) log_worker_pool.exec({
        log_api_token,
        payload: {
            service: request.headers.host,
            client: request.headers['x-forwarded-for'] || '192.168.1.254',
            request_method: request.method, request_url: request.url, request_agent: request.headers['user-agent'],
            response_code: resp_code, response_file: file_path + encoding, response_mime: content_type
        }
    })
}

if (process.env.CERT_PATH)
    http2.createSecureServer({
        cert: readFileSync(process.env.CERT_PATH + 'cert.pem'),
        key: readFileSync(process.env.CERT_PATH + 'privkey.pem'),
        allowHTTP1: true
    }, handler).listen(process.env.PORT)
else
    http.createServer(handler).listen(process.env.PORT)

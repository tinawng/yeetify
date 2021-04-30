
<p align="center">
    <img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/dash-symbol_1f4a8.png"/>
    <br/>
    <br/>
    <img src="https://img.shields.io/badge/node.js--339933?style=for-the-badge&logo=node.js"/>
</p>

# Infos

💨 ***Yeetify*** is a tiny tiny & easy to use static web server. Just dump your static files into `./dist` folder and you're ready to go.

Built with a minimal (and naive ?) approach, the least dependencies and <100 lines of code using ***raw Nodejs***.

Works well with Nuxt.js static generation, Gridsome, etc... in addition to `compress` script (see below) if file compression is not included in your build process.

# Features

- ⚡️ HTTP2 support (comes with 🔒 HTTPS)
- 📦 Brotli compression support (with GZip fallback)
- ♻️ Optimised cache policy for compatible files
- 🗃️ Server level file cache
- 🔊 Asynchronous logging for minimal impact on performance 

# Dependencies

- 🔧 *[dotenv](https://www.npmjs.com/package/dotenv)*
- ⚡️ *[cachedfs](https://www.npmjs.com/package/cachedfs)*
- 🗃️ *[pino](https://www.npmjs.com/package/pino)*

# Next

- [x] Async logging *(using Pino?)*

# Use Process

```bash
# install dependencies
$ npm install

# run post-build compression if needed
$ npm run compress

# run server with pm2 (recommended)
$ pm2 start app.js --name "instance_name"
# run server with node
$ node app.js

# run http server (not recommended)
$ node app-legacy.js
```

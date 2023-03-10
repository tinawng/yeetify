
<p align="center">
    <img src="https://em-content.zobj.net/thumbs/160/apple/325/dashing-away_1f4a8.png"/>
    <br/>
    <br/>
    <img src="https://img.shields.io/badge/node.js--339933?style=for-the-badge&logo=node.js"/>
</p>

# Infos

💨 ***Yeetify*** is a tiny tiny & easy to use static web server. Just dump your static files into `./dist` folder and you're ready to go.

Built with a minimal (and naive ?) approach, the least dependencies and <100 lines of code using ***raw Nodejs***.

Works well with Vite, Nuxt.js static generation, Gridsome, etc... in addition to `compress` script (see below) if file compression is not included in your build process.

# Features

- ⚡️ HTTP2 support (comes with 🔒 HTTPS)
- 📦 Brotli & GZip compression support
- ♻️ Optimised cache policy
- 🗃️ In-memory files cache

# Dependencies

- 🔧 *[dotenv](https://www.npmjs.com/package/dotenv)*

# Let's yeet

```bash
# install dependencies
$ npm install

# run post-build compression if needed
$ npm run compress

# run server with pm2 (recommended)
$ pm2 start app.js --name "instance_name"
# run server with node
$ node app.js
```

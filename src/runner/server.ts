import finalhandler from 'finalhandler'
import http from 'http'
import serveStatic from 'serve-static'
 
const serve = serveStatic('./dist', { index: ['index.html'] })

const server =
  http.createServer((req, res) =>
    serve(req, res, finalhandler(req, res)))

server.listen(10485)

import path from 'path'
import Koa from 'koa'
import serve from 'koa-static'
import mount from 'koa-mount'
import getPort from 'get-port'

export const port = getPort({ port: 10485 })

const app = new Koa()
const epk = new Koa()
epk.use(serve(path.resolve(__dirname, '..', 'dist')))
const tests = new Koa()
tests.use(serve(path.resolve(process.cwd(), '.epk', 'dist')))

app.use(mount('/epk', epk))
app.use(mount('/tests', tests))

port.then(port =>
  app.listen(port))

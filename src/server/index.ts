import path from 'path'

import { installImport, Observable as AsyncObservable, cwd } from '../utils'

let imports

export default options =>
  AsyncObservable(async observer => {
    const { port } = options
    if (!imports) imports = await installImport(['koa', 'koa-static', 'koa-mount'])

    const [ Koa, serve, mount ] = imports

    const app = new Koa()

    const epk = new Koa()
    epk.use(serve(path.resolve(__dirname, '..', 'lib')))

    const tests = new Koa()
    tests.use(serve(path.resolve(cwd, '.epk', 'dist')))

    app.use(mount('/epk', epk))
    app.use(mount('/tests', tests))

    await app.listen(port)
    
    observer.next(app)

    return () => app.close()
  })
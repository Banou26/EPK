import path from 'path'
import { Observable } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import localRequire from '../utils/localRequire.ts'

let imports

export default options =>
  switchMap(val =>
    Observable.create(observer => {
      const { port } = options
      if (!imports) imports = localRequire(['koa', 'koa-static', 'koa-mount'])

      const app = imports.then(([Koa, serve, mount]) => {
        const app = new Koa()
        const epk = new Koa()
        epk.use(serve(path.resolve(__dirname, '..', 'dist')))
        const tests = new Koa()
        tests.use(serve(path.resolve(process.cwd(), '.epk', 'dist')))
        
        app.use(mount('/epk', epk))
        app.use(mount('/tests', tests))
        try {
          return app.listen(port)
        } finally {
          observer.next(val)
        }
      })

      return _ => app.then(app => app.close())
    })
  )

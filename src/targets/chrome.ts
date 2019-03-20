import path from 'path'
import { Observable } from 'rxjs'
import localRequire from '../utils/localRequire'
import { TargetRuntimeObservable } from '../types'
import { transformPathToEpkUrl } from '../utils'

let pptr

export default (options): TargetRuntimeObservable =>
  Observable.create(observer => {
    if (!pptr) pptr = localRequire('puppeteer', __filename)

    let closed
    const browser = pptr.then(pptr => pptr.launch({ devtools: true }))

    browser.then(browser => {
      if (closed) return
      observer.next(Observable.create(observer => {
        const page = browser.newPage()
        const a = path.resolve(__dirname, '..', 'dist', 'empty.html')
        const _path = transformPathToEpkUrl(path.resolve(__dirname, '..', 'dist', 'empty.html'), options.port)
        page.then(page => {
          observer.next({
            loadFile: file => page.goto(transformPathToEpkUrl(path.resolve(process.cwd(), 'dist/empty.html'), options.port)).then(() => page.addScriptTag({ url: file.url })),
            exec: str => page.evaluate(str)
          })
        })
        return () => page.then(page => page.close())
      }))
    })

    return () => {
      closed = true
      browser.then(browser => browser.close())
    }
  })

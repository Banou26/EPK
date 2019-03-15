import { Observable } from 'rxjs'
import localRequire from '../utils/localRequire'
import { TargetRuntimeObservable } from '../types'
import { transformPathToUrl } from '../utils'

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
        page.then(page => {
          observer.next({
            loadFile: file => page.goto(transformPathToUrl('/epk/empty.html', options.port)).then(() => page.evaluate()),
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

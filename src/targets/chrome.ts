import path from 'path'
import { Observable } from 'rxjs'

import localRequire from '../utils/localRequire.ts'
import { transformPathToEpkUrl } from '../utils/index.ts'
import { TargetRuntimeObservable } from '../types.ts'

let pptr

export default (options): TargetRuntimeObservable =>
  Observable.create(observer => {
    if (!pptr) pptr = localRequire('puppeteer')

    let closed
    const browser = pptr.then(pptr => pptr.launch({ devtools: true }))

    browser.then(browser => {
      if (closed) return
      observer.next(Observable.create(observer => {
        const page = browser.newPage()
        const emptyHTMLFilePath = path.resolve(__dirname, '..', 'dist', 'empty.html')
        const url = transformPathToEpkUrl(emptyHTMLFilePath, options.port)
        page.then(page => {
          observer.next({
            loadFile: file => page.goto(url).then(() => page.addScriptTag({ url: file.url })),
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

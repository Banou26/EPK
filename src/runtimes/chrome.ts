import path from 'path'

import { installImport, Observable as AsyncObservable, pathToEpkUrl } from '../utils/index.ts'
import { TestFile, EPK_SUBJECT, EPK_RUNTIME_SUBJECT } from '../types.ts'
import { ReplaySubject, Subject } from 'rxjs'
import { stringify, parse } from '../utils/index.ts'

let pptr

export default ({ port }) =>
  AsyncObservable(async observer => {
    if (!pptr) pptr = await installImport('puppeteer')

    const rootBrowser = await pptr.launch({ devtools: true })

    observer.next(
      AsyncObservable(async observer => {
        const emptyHTMLFilePath = path.resolve(__dirname, '..', 'lib', 'empty.html')
        const emptyPageUrl = pathToEpkUrl(emptyHTMLFilePath, { port })

        const browser = await rootBrowser.createIncognitoBrowserContext()
        const page = await browser.newPage()
        
        const inMessages = new ReplaySubject()
        page.exposeFunction(
          EPK_RUNTIME_SUBJECT,
          value => inMessages.next(parse(value))
        )

        let subjectHandle

        const outMessages = new Subject()
        outMessages.subscribe(value =>
          page.evaluate(
            (subject, value) => subject.next(value),
            subjectHandle,
            stringify(value)
          )
        )

        observer.next({
          inMessages,
          outMessages,
          loadFile: async (testFile: TestFile) => {
            await page.goto(emptyPageUrl)
            await page.addScriptTag({ url: testFile.url })
            subjectHandle = await page.evaluateHandle(
              (subjectGlobalProperty) => globalThis[subjectGlobalProperty],
              EPK_SUBJECT
            )
          }
        })

        return () => page.close()
      })
    )

    return () => rootBrowser.close()
  })

  // Observable.create(observer => {
  //   if (!pptr) installImport('puppeteer').then(_pptr => pptr = _pptr)

  //   const browser = pptr.then(pptr => pptr.launch({ devtools: true }))

  //   browser.then(browser =>
  //     observer.next(Observable.create(observer => {
  //       const page = browser.newPage()
  //       const emptyHTMLFilePath = path.resolve(__dirname, '..', 'dist', 'empty.html')
  //       const url = transformPathToEpkUrl(emptyHTMLFilePath, options.port)
  //       page.then(page => {
  //         observer.next({
  //           loadFile: file => page.goto(url).then(() => page.addScriptTag({ url: file.url })),
  //           exec: str => page.evaluate(str)
  //         })
  //       })
  //       return () =>
  //         page.then(page =>
  //           page.close())
  //     })))

  //   return () =>
  //     browser.then(browser =>
  //       browser.close())
  // })

import fs from 'fs'
import util from 'util'
import { Observable, of } from 'rxjs'
import { mergeMap, switchMap, take, tap, filter } from 'rxjs/operators'
import { TESTS_METADATA } from '../utils.ts'
const readFile = util.promisify(fs.readFile)

const getTestsMetadata =
  (browser, bundle) =>
    Observable.create(observer => {
      let cancelled
      (async _ => {
        const [file, page] = await Promise.all([readFile(bundle.name, 'utf8'), browser.newPage()])
        const close = _ => page.close()
        if (cancelled) return close(0)
        // page.on('console', msg => console.log(msg.text()))
        const result = await new Promise(async (resolve, reject) => {
          await page.exposeFunction(TESTS_METADATA, async res => {
            resolve(res)
          })
          if (cancelled) return close(1)
          page.evaluate(file).catch(_ => {})
        })
        close(2)
        observer.next(result)
      })()
      return _ => (cancelled = true)
    })

const pageProvider =
  (browser, maxPages = 5) =>
    Observable.create(observer => {
      Promise.all(
        Array(5)
          .map(_ =>
            browser.newPage()))
        .then(pages => {

        })
      return _ => {

      }
    })

export default ({ browser, maxPages = 25 }) =>
  switchMap(rootBundle =>
    of(
      ...rootBundle.isEmpty
        ? Array.from(rootBundle.childBundles)
        : [rootBundle])
      .pipe(
        mergeMap(bundle =>
          getTestsMetadata(browser, bundle),
        maxPages)))
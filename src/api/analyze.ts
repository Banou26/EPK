import path from 'path'
import { switchMap, mergeMap, take } from 'rxjs/operators'
import { of, from, merge, Observable } from 'rxjs'
import { Context, MESSAGE_TYPE, BROWSER, File } from '../types'
import { callPageFunction, transformPathToUrl } from './utils'
import logger from '../cli/logger'

const analyzeChrome = (page, url) =>
  callPageFunction(page, MESSAGE_TYPE.GET_TESTS, url)

const analyzeFirefox = (page, url) =>
  callPageFunction(page, MESSAGE_TYPE.GET_TESTS, url)

const analyzes = {
  [BROWSER.CHROME]: analyzeChrome,
  [BROWSER.FIREFOX]: analyzeFirefox
}

export default
  switchMap((ctx: Context) =>
    merge(
      ...ctx.browsers.map(browser =>
        ctx.files.map(({ url }: File) =>
            // @ts-ignore
            (ctx.pageProvider[browser])
            // @ts-ignore
            |> switchMap((page: Page) =>
              Observable.create(observer => {
                analyzes[browser](page, url)
                  .then((res) => {
                    observer.next({
                      res,
                      browser,
                      url
                    })
                  })
                return _ => {}
              })
            )
        )
      )
      .flat()
    )
  )

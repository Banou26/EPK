import path from 'path'
import { switchMap, mergeMap, take, delay } from 'rxjs/operators'
import { of, from, merge, Observable } from 'rxjs'
import { Context, MESSAGE_TYPE, ENVIRONMENT, File } from '../types'
import { callPageFunction, transformPathToUrl } from './utils'
import logger from '../cli/logger'

const analyzeChrome = (page, url) =>
  callPageFunction(page, MESSAGE_TYPE.GET_TESTS, url)

const analyzeFirefox = (page, url) =>
  callPageFunction(page, MESSAGE_TYPE.GET_TESTS, url)

const analyzes = {
  [ENVIRONMENT.CHROME]: analyzeChrome,
  [ENVIRONMENT.FIREFOX]: analyzeFirefox
}

export default
  switchMap((ctx: Context) =>
    merge(
      ...ctx.browsers.map(browser =>
        ctx.files.map((file: File) =>
            // @ts-ignore
            (ctx.pageProvider[browser])
            // @ts-ignore
            |> switchMap((page: Page) =>
              Observable.create(observer => {
                analyzes[browser](page, file)
                  .then((res: File) => {
                    observer.next({
                      ...ctx,
                      file: res,
                      browser
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

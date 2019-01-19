import path from 'path'
import { Observable } from 'rxjs'
import { Page } from 'puppeteer'
import { switchMap } from 'rxjs/operators'
import { GET_TESTS } from '../utils'
import { AnalyzedContext } from '../types'

export const browser: (page: Page) => Observable<AnalyzedContext> =
  page =>
    switchMap(({ bundle }) =>
      page
        .evaluate(
          ({ GET_TESTS, urls }: { GET_TESTS: string, urls: string[] }) =>
            window[GET_TESTS](urls),
          {
            GET_TESTS,
            urls:
              (bundle.isEmpty
                ? Array.from(bundle.childBundles)
                : [bundle])
                .map(({ name }) => name.replace(`${path.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/'))
          })
          .then(result => ({
            bundle,
            tests: result
          })))

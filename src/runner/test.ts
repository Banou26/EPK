import path from 'path'
import { Page } from 'puppeteer'
import { switchMap, tap } from 'rxjs/operators'
import { RUN_TESTS } from '../utils'
import { TestResult, Test } from '../types'
import { Observable } from 'rxjs'

export const browser = (page: Page): Observable<TestedContext> =>
  switchMap(async ({ bundle, tests }: { bundle: any, tests: Test[] }) =>
    page.coverage.startJSCoverage()
      .then(async _ => ({
        bundle,
        tests,
        testsResult:
          await page
            .evaluate(
              ({ RUN_TESTS, tests }: { RUN_TESTS: string, tests: Test[] }) =>
                window[RUN_TESTS](tests),
              {
                RUN_TESTS,
                tests
              }),
        testsCoverage: await page.coverage.stopJSCoverage()
      })))

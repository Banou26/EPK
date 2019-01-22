import path from 'path'
import chalk from 'chalk'
import { Page } from 'puppeteer'
import { switchMap, tap } from 'rxjs/operators'
import { prettifyTime, prettifyPath } from './utils'
import { RUN_TESTS } from '../utils'
import { TestResult, Test, TestedContext, AnalyzedContext } from '../types'
import { Observable, of } from 'rxjs'
import logger from './logger'

export const browser: Observable<TestedContext> =
  // @ts-ignore
  switchMap(async (ctx: AnalyzedContext): TestedContext => {
    const { page, bundle, tests } = ctx
    await page.coverage.startJSCoverage()
    const testsResult = await page.evaluate(
        ({ RUN_TESTS, tests }: { RUN_TESTS: string, tests: Test[] }) =>
          window[RUN_TESTS](tests),
        {
          RUN_TESTS,
          tests
        }
      )
    return {
      testsResult,
      testsCoverage: await page.coverage.stopJSCoverage(),
      ...ctx
    }
  })

export default
  switchMap(val =>
    // @ts-ignore
    of(val)
    // @ts-ignore
    |> tap((ctx: TestedContext) => {
        ctx.analyzeEndTime = Date.now()
        ctx.testStartTime = Date.now()
        const { entryPoints, buildStartTime, bundledTime, analyzeEndTime, analyzeStartTime } = ctx
        logger.progress(`\n${
          chalk.green(`Built in ${prettifyTime(bundledTime - buildStartTime)}.`)
        }\n${
          chalk.green(`Analyzed in ${prettifyTime(analyzeEndTime - analyzeStartTime)}.`)
        }\n${
          chalk.green(`Testing ${entryPoints.map(prettifyPath).join(', ')}.`)}`)
      })
    // @ts-ignore
    |> browser)
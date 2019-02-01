import path from 'path'
import chalk from 'chalk'
import { Observable, of } from 'rxjs'
import { Page } from 'puppeteer'
import { switchMap, filter, tap, map } from 'rxjs/operators'
import { prettifyPath, prettifyTime } from './utils'
import { isBrowser, GET_TESTS } from '../utils'
import { AnalyzedContext, TestedContext } from '../types'
import logger from './logger'

export const browser: Observable<AnalyzedContext> =
  // @ts-ignore
  switchMap(async (ctx: AnalyzedContext) => {
    const { bundle, page } = ctx
    const { tests, errors} = await page.evaluate(
        ({ GET_TESTS, urls }: { GET_TESTS: string, urls: string[] }) =>
          window[GET_TESTS](urls),
        {
          GET_TESTS,
          urls:
            (bundle.isEmpty
              ? Array.from(bundle.childBundles)
              : [bundle])
              .map(({ name: distPath, entryAsset: { name: sourcePath } }) => ({
                sourcePath,
                distPath,
                url: distPath.replace(`${path.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/')
              }))
        }
      )
    return {
      tests,
      errors,
      ...ctx
    }
  })

export default
  switchMap(val =>
    // @ts-ignore
    of(val)
    // @ts-ignore
    |> tap(({ entryPoints, bundledTime, buildStartTime }: TestedContext) => {
        logger.progress(`\n${
          chalk.green(`Built in ${prettifyTime(bundledTime - buildStartTime)}.`)
        }\n${
          chalk.grey(`Analyzing ${entryPoints.map(prettifyPath).join(', ')}`)}.`)
      })
      // @ts-ignore
    |> tap((ctx: TestedContext) => (ctx.analyzeStartTime = Date.now()))
    // @ts-ignore
    |> browser)

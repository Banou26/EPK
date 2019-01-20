import path from 'path'
import chalk from 'chalk'
import { Observable, of } from 'rxjs'
import { Page } from 'puppeteer'
import { switchMap, filter, tap, map } from 'rxjs/operators'
import { prettifyPath, prettifyTime } from './utils'
import { isBrowser, GET_TESTS } from '../utils'
import { AnalyzedContext } from '../types'
import logger from './logger'

export const browser: Observable<AnalyzedContext> =
  switchMap(async ctx => {
    const { bundle, page } = ctx
    const tests = await page.evaluate(
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
      ...ctx
    }
  })

export default
  switchMap(val =>
    of(val)
    |> tap(({ entryPoints, bundledTime, buildStartTime }) => {
        logger.progress(`\n${
          chalk.green(`Built in ${prettifyTime(bundledTime - buildStartTime)}.`)
        }\n${
          chalk.grey(`Analyzing ${entryPoints.map(prettifyPath).join(', ')}`)}.`)
      })
    |> tap(ctx => (ctx.analyzeStartTime = Date.now()))
    |> browser)
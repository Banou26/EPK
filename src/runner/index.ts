import Path from 'path'
import chalk from 'chalk'
import fg from 'fast-glob'
import { filter, publish, switchMap, tap, catchError } from 'rxjs/operators'
import puppeteer, { Page, Browser } from 'puppeteer'
import cli from './cli'
import { prettifyPath, prettifyTime } from './utils'
import Bundler from './bundler'
import logger from './logger'
import { port } from './server'
import analyze from './analyze'
import test from './test'
import { of, Observable } from 'rxjs'
import postAnalyze from './post-analyze'

const init = async ({ node = false } = {}): Promise<Observable<any>> => {
  logger.progress(`\n${chalk.grey(`Preparing the environment.`)}`)
  const globs: string[] = await cli()

  const browser: Browser = await puppeteer.launch({ devtools: true })
  const page: Page = !node && (await browser.pages())[0]

  page.on('console', msg => logger.log(`browser: ${msg.text()}`))

  await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)

  const entryFiles =
    (await fg.async(globs))
      .map(path => Path.join(process.cwd(), path))

  return (Bundler(entryFiles)
    // @ts-ignore
    |> filter(({ name }) => name === 'buildStart')
    // @ts-ignore
    |> tap(_ => {
        logger.clear()
        logger.progress(`\n${chalk.grey(`Building ${entryFiles.map(prettifyPath).join(', ')}`)}`)
      })
      // @ts-ignore
    |> switchMap(({ bundler, entryPoints, buildStartTime }) =>
        // @ts-ignore
        bundler
        // @ts-ignore
        |> filter(({ name }) => name === 'bundled')
        // @ts-ignore
        |> switchMap(async ctx => {
            await page.reload()
            return {
              bundler,
              entryPoints,
              page,
              buildStartTime,
              ...ctx
            }
          })
        // @ts-ignore
        |> analyze
        // @ts-ignore
        |> test
        // @ts-ignore
        |> postAnalyze)) as any
}

if (!module.parent) {
  init()
    .then(obs =>
      obs.subscribe(_ => {}))
}
